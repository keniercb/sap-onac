import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un endpoint como público (no requiere autenticación).
 * Úsalo con: @Public() en cualquier método del controller.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
