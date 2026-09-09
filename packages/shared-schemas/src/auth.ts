import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio').max(50),
  password: z.string().min(1, 'La contraseña es obligatoria').max(255),
  twoFactorCode: z
    .string()
    .regex(/^\d{6}$/, 'El código debe ser 6 dígitos')
    .optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
    newPassword: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(255)
      .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
      .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un símbolo'),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const verify2FASchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'El código debe ser 6 dígitos'),
});

export const enable2FASchema = z.object({
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type Verify2FASchema = z.infer<typeof verify2FASchema>;
