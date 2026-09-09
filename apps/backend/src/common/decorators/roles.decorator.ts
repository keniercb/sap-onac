import { SetMetadata } from '@nestjs/common';

/**
 * Restringe el acceso a los roles indicados. Úsalo junto con RolesGuard y JwtAuthGuard.
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('ADMIN_ONAC', 'AUDITOR')
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
