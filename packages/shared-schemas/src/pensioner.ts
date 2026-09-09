import { z } from 'zod';

/**
 * Valida el Carnet de Identidad cubano (11 dígitos) con dígito verificador.
 * Formato: AABBMMCNNNX donde AABBMM = fecha nacimiento, C = siglo,
 * NNN = número de orden, X = dígito verificador (algoritmo cubano estándar).
 */
export const identityCardSchema = z
  .string()
  .length(11, 'El Carnet de Identidad debe tener 11 dígitos')
  .regex(/^\d{11}$/, 'El Carnet de Identidad solo admite dígitos')
  .refine((ci) => {
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const partial = Number(ci[i]) * weights[i];
      sum += partial > 9 ? partial - 9 : partial;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === Number(ci[10]);
  }, 'Dígito verificador del Carnet de Identidad inválido');

export const createPensionerSchema = z.object({
  identityCard: identityCardSchema,
  certificateSerial: z.string().max(50).optional(),
  firstName: z.string().min(1, 'Los nombres son obligatorios').max(100),
  lastName1: z.string().min(1, 'El primer apellido es obligatorio').max(100),
  lastName2: z.string().max(100).optional(),
  knownAs: z.string().max(150).optional(),
  address: z.string().max(500).optional(),
  provinceId: z.number().int().positive('La provincia es obligatoria'),
  municipalityId: z.number().int().positive('El municipio es obligatorio'),
  sexId: z.number().int().positive().optional(),
  skinColorId: z.number().int().positive().optional(),
  healthStatusId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  civilStatusId: z.number().int().positive().optional(),
  laborLinkId: z.number().int().positive().optional(),
  salary: z.number().nonnegative().optional(),
  aep: z.boolean().optional(),
  pmtAmount: z.number().nonnegative().optional(),
  pensionTypeId: z.number().int().positive().optional(),
  grantedBy: z.string().max(150).optional(),
  socialSecurityPension: z.number().nonnegative().optional(),
  bankControlNumber: z.string().max(20).optional(),
  housingTypeId: z.number().int().positive().optional(),
  propertyTypeId: z.number().int().positive().optional(),
});

export const updatePensionerSchema = createPensionerSchema
  .partial()
  .extend({
    version: z.number().int().positive('La versión es obligatoria para control de concurrencia'),
  });

export const pensionerFiltersSchema = z.object({
  provinceId: z.number().int().positive().optional(),
  municipalityId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  currentState: z
    .enum(['active', 'inactive', 'deceased', 'reincorporated_sma'])
    .optional(),
  search: z.string().max(255).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(50),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreatePensionerSchema = z.infer<typeof createPensionerSchema>;
export type UpdatePensionerSchema = z.infer<typeof updatePensionerSchema>;
export type PensionerFiltersSchema = z.infer<typeof pensionerFiltersSchema>;
