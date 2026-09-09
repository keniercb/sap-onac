import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '@common/prisma/prisma.service';

export interface AuditContext {
  userId?: string | null;
  action: 'create' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'failed_login' | 'view_sensitive';
  entityType: string;
  entityId?: bigint | null;
  entityUuid?: string | null;
  previousValues?: unknown;
  newValues?: unknown;
  ipAddress: string;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una entrada en el log de auditoría con hash encadenado al registro anterior.
   * El hash se calcula como: sha256(previous_hash + payload_json + occurred_at)
   * Esto hace que cualquier modificación de un registro previo invalide toda la cadena.
   */
  async log(ctx: AuditContext): Promise<void> {
    try {
      // Obtener el hash del último registro
      const lastEntry = await this.prisma.auditLog.findFirst({
        orderBy: { id: 'desc' },
        select: { recordHash: true },
      });
      const previousHash = lastEntry?.recordHash ?? 'GENESIS';

      const occurredAt = new Date();
      const payload = {
        userId: ctx.userId ?? null,
        action: ctx.action,
        entityType: ctx.entityType,
        entityId: ctx.entityId ? ctx.entityId.toString() : null,
        entityUuid: ctx.entityUuid ?? null,
        previousValues: ctx.previousValues ?? null,
        newValues: ctx.newValues ?? null,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent ?? null,
        occurredAt: occurredAt.toISOString(),
      };

      const payloadJson = JSON.stringify(payload);
      const recordHash = crypto
        .createHash('sha256')
        .update(previousHash + payloadJson)
        .digest('hex');

      await this.prisma.auditLog.create({
        data: {
          uuid: crypto.randomUUID(),
          userId: ctx.userId ?? null,
          action: ctx.action,
          entityType: ctx.entityType,
          entityId: ctx.entityId ?? null,
          entityUuid: ctx.entityUuid ?? null,
          previousValues: ctx.previousValues as never ?? null,
          newValues: ctx.newValues as never ?? null,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent ?? null,
          occurredAt,
          recordHash,
        },
      });
    } catch (err) {
      // La auditoría no debe romper el flujo principal; solo loggear el error
      this.logger.error(`Error al registrar auditoría: ${(err as Error).message}`, (err as Error).stack);
    }
  }

  /**
   * Lista las entradas del log de auditoría con filtros opcionales.
   */
  async findMany(options: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  } = {}) {
    const page = Math.max(options.page ?? 1, 1);
    const pageSize = Math.min(options.pageSize ?? 50, 200);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (options.userId) where.userId = options.userId;
    if (options.action) where.action = options.action;
    if (options.entityType) where.entityType = options.entityType;
    if (options.startDate || options.endDate) {
      where.occurredAt = {};
      if (options.startDate) (where.occurredAt as Record<string, unknown>).gte = options.startDate;
      if (options.endDate) (where.occurredAt as Record<string, unknown>).lte = options.endDate;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { occurredAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.uuid,
        numericId: Number(item.id),
        userId: item.userId,
        userName: item.user?.fullName ?? null,
        userUsername: item.user?.username ?? null,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId ? Number(item.entityId) : null,
        entityUuid: item.entityUuid,
        previousValues: item.previousValues,
        newValues: item.newValues,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
        occurredAt: item.occurredAt.toISOString(),
        recordHash: item.recordHash,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Verifica la integridad de la cadena de auditoría recomputando hashes.
   * Retorna la primera entrada inválida encontrada, o null si todo está bien.
   */
  async verifyIntegrity(limit = 10000): Promise<{ valid: boolean; invalidEntry?: string }> {
    const entries = await this.prisma.auditLog.findMany({
      orderBy: { id: 'asc' },
      take: limit,
      select: { uuid: true, recordHash: true, userId: true, action: true, entityType: true, entityId: true, entityUuid: true, previousValues: true, newValues: true, ipAddress: true, userAgent: true, occurredAt: true },
    });

    let previousHash = 'GENESIS';
    for (const entry of entries) {
      const payload = {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ? entry.entityId.toString() : null,
        entityUuid: entry.entityUuid,
        previousValues: entry.previousValues,
        newValues: entry.newValues,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        occurredAt: entry.occurredAt.toISOString(),
      };
      const payloadJson = JSON.stringify(payload);
      const expectedHash = crypto
        .createHash('sha256')
        .update(previousHash + payloadJson)
        .digest('hex');
      if (entry.recordHash !== expectedHash) {
        return { valid: false, invalidEntry: entry.uuid };
      }
      previousHash = entry.recordHash;
    }
    return { valid: true };
  }
}
