import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { AuditService } from '@modules/audit/audit.service';
import type { AuthenticatedUser } from '@common/decorators/current-user.decorator';

/**
 * Intercepta respuestas exitosas de operaciones de escritura (POST/PATCH/DELETE)
 * y registra una entrada en el log de auditoría.
 *
 * Para usarlo en un controller:
 *   @UseInterceptors(AuditInterceptor)
 *
 * El interceptor infiere el tipo de entidad desde la ruta:
 *   /api/pensioners → entityType: 'pensioner'
 *   /api/users      → entityType: 'user'
 *
 * El `entityId` se extrae del resultado o del parámetro de ruta.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const method = request.method;

    // Solo auditar operaciones de escritura
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const path = request.path || request.url || '';
    const entityType = this.inferEntityType(path);
    const entityIdParam = this.extractIdFromPath(path);
    const action = this.methodToAction(method);
    const user = request.user;
    const ipAddress = (request.headers['x-forwarded-for'] as string) || request.socket.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'] ?? null;

    return next.handle().pipe(
      tap({
        next: (response: unknown) => {
          // Extraer id de la respuesta si está disponible
          let entityId: bigint | null = null;
          let entityUuid: string | null = null;
          if (response && typeof response === 'object') {
            const r = response as Record<string, unknown>;
            if (r.numericId) entityId = BigInt(r.numericId as number);
            else if (r.id && typeof r.id === 'number') entityId = BigInt(r.id);
            if (r.id && typeof r.id === 'string' && r.id.length === 36) entityUuid = r.id;
            else if (r.uuid && typeof r.uuid === 'string') entityUuid = r.uuid;
          }
          if (!entityId && entityIdParam) entityId = BigInt(entityIdParam);

          this.auditService
            .log({
              userId: user?.id ?? null,
              action,
              entityType,
              entityId,
              entityUuid,
              newValues: method !== 'DELETE' ? this.sanitize(request.body) : null,
              ipAddress,
              userAgent,
            })
            .catch(() => {
              // Errores de auditoría no deben romper el flujo
            });
        },
      }),
    );
  }

  private inferEntityType(path: string): string {
    if (path.includes('/pensioners')) return 'pensioner';
    if (path.includes('/users')) return 'user';
    if (path.includes('/catalogs/')) return 'catalog_item';
    if (path.includes('/movements')) return 'movement';
    if (path.includes('/auth/login')) return 'session';
    if (path.includes('/auth/logout')) return 'session';
    return 'unknown';
  }

  private extractIdFromPath(path: string): string | null {
    const match = path.match(/\/([a-f0-9-]{36}|\d+)(?:\/|$)/);
    return match ? match[1] : null;
  }

  private methodToAction(
    method: string,
  ): 'create' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'view_sensitive' {
    switch (method) {
      case 'POST':
        return 'create';
      case 'PATCH':
      case 'PUT':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'view_sensitive';
    }
  }

  /**
   * Sanitiza el body eliminando campos sensibles antes de loggear.
   */
  private sanitize(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;
    const sanitized = { ...(body as Record<string, unknown>) };
    const sensitiveKeys = ['password', 'passwordHash', 'twoFactorSecret', 'currentPassword', 'newPassword', 'refreshToken'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
