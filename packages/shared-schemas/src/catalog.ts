import { z } from 'zod';

export const createCatalogItemSchema = z.object({
  code: z
    .string()
    .min(1, 'El código es obligatorio')
    .max(20, 'El código no puede exceder 20 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'El código solo admite mayúsculas, números y guion bajo'),
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const updateCatalogItemSchema = createCatalogItemSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    version: z.number().int().positive(),
  });

export const catalogCodeSchema = z.enum([
  'province',
  'municipality',
  'sex',
  'skin_color',
  'health_status',
  'pensioner_category',
  'civil_status',
  'labor_link',
  'pension_type',
  'er_front',
  'er_military_rank',
  'far_minint_rank',
  'medical_incacity_type',
  'incacity',
  'sequel',
  'gesta',
  'mission',
  'housing_type',
  'property_type',
  'association',
  'movement_cause',
  'kinship',
  'need_type',
  'electrodomestic',
  'phone_type',
  'cemetery',
  'crematorium',
  'disease',
]);

export type CreateCatalogItemSchema = z.infer<typeof createCatalogItemSchema>;
export type UpdateCatalogItemSchema = z.infer<typeof updateCatalogItemSchema>;
export type CatalogCodeSchema = z.infer<typeof catalogCodeSchema>;
