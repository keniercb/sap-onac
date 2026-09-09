'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginSchema } from '@sap-onac/shared-schemas';
import { FormField, FormInput, cn } from '@sap-onac/ui-kit';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  async function onSubmit(values: LoginSchema) {
    setError(null);
    setIsLoading(true);
    try {
      const data = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>('/auth/login', values);
      api.setToken(data.accessToken, data.refreshToken);
      setAuth(data.user, data.accessToken);
      router.push('/dashboard');
    } catch (err) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message ?? 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-8">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">SAP-ONAC</h1>
          <p className="text-sm text-neutral-500">
            Ingrese sus credenciales para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Usuario"
            htmlFor="username"
            required
            error={errors.username?.message}
          >
            <FormInput
              id="username"
              autoComplete="username"
              invalid={!!errors.username}
              {...register('username')}
            />
          </FormField>

          <FormField
            label="Contraseña"
            htmlFor="password"
            required
            error={errors.password?.message}
          >
            <FormInput
              id="password"
              type="password"
              autoComplete="current-password"
              invalid={!!errors.password}
              {...register('password')}
            />
          </FormField>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow transition-colors',
              'hover:bg-blue-700',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-xs text-center text-neutral-400">
          Si olvidó su contraseña, contacte al administrador del sistema
        </p>
      </div>
    </main>
  );
}

import type { AuthUser } from '@sap-onac/shared-types';
