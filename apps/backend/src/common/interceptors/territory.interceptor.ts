import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import type { AuthenticatedUser } from '@common/decorators/current-user.decorator';

/**
 * No transforma la respuesta; solo inyecta en `request.territoryFilter` un objeto
 * con los IDs de provincias/municipios a los que el usuario tiene acceso.
 *
 * Los servicios de negocio pueden leer este filtro vía `request.territoryFilter`
 * y aplicarlo a sus consultas Prisma.
 *
 * Reglas (según ADR-003):
 *   - ADMIN_ONAC y AUDITOR: sin filtro (acceso nacional)
 *   - OPERADOR_PROVINCIAL: filtrar por las provincias asignadas
 *   - OPERADOR_MUNICIPAL: filtrar por los municipios asignados (implícitamente por provincia)
 */
@Injectable()
export class TerritoryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: AuthenticatedUser; territoryFilter?: TerritoryFilter }
    >();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    const isAdminOrAuditor = user.roles.some(
      (r) => r === 'ADMIN_ONAC' || r === 'AUDITOR',
    );

    if (isAdminOrAuditor) {
      request.territoryFilter = { provinces: null, municipalities: null };
      return next.handle();
    }

    const provinces = new Set<number>();
    const municipalities = new Set<number>();

    for (const t of user.territories) {
      if (t.roleCode === 'OPERADOR_PROVINCIAL' && t.provinceId) {
        provinces.add(Number(t.provinceId));
      } else if (t.roleCode === 'OPERADOR_MUNICIPAL') {
        if (t.municipalityId) municipalities.add(Number(t.municipalityId));
        if (t.provinceId) provinces.add(Number(t.provinceId));
      }
    }

    request.territoryFilter = {
      provinces: provinces.size ? Array.from(provinces) : null,
      municipalities: municipalities.size ? Array.from(municipalities) : null,
    };

    return next.handle();
  }
}

export interface TerritoryFilter {
  /** IDs de provincias a las que el usuario tiene acceso; null = sin restricción */
  provinces: number[] | null;
  /** IDs de municipios a los que el usuario tiene acceso; null = sin restricción */
  municipalities: number[] | null;
}
