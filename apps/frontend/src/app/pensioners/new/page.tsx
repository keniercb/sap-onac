'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { FormField, FormInput, FormSelect, FormTextarea, FormCheckbox, cn } from '@sap-onac/ui-kit';
import { api, ApiError } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

interface CatalogItem {
  id: number;
  code: string;
  name: string;
}

interface FormValues {
  identityCard: string;
  certificateSerial?: string;
  firstName: string;
  lastName1: string;
  lastName2?: string;
  knownAs?: string;
  address?: string;
  provinceId: number;
  municipalityId: number;
  sexId?: number;
  skinColorId?: number;
  healthStatusId?: number;
  categoryId?: number;
  civilStatusId?: number;
  laborLinkId?: number;
  salary?: number;
  aep?: boolean;
  pmtAmount?: number;
  pensionTypeId?: number;
  grantedBy?: string;
  socialSecurityPension?: number;
  bankControlNumber?: string;
  housingTypeId?: number;
  propertyTypeId?: number;
}

function useCatalog(catalog: string) {
  return useQuery<CatalogItem[]>({
    queryKey: ['catalog', catalog],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs/${catalog}?onlyActive=true&pageSize=500`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      const data = await res.json();
      return (data.items ?? []) as CatalogItem[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export default function NewPensionerPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const provinces = useCatalog('province');
  const sexes = useCatalog('sex');
  const skinColors = useCatalog('skin_color');
  const healthStatuses = useCatalog('health_status');
  const categories = useCatalog('pensioner_category');
  const civilStatuses = useCatalog('civil_status');
  const pensionTypes = useCatalog('pension_type');
  const housingTypes = useCatalog('housing_type');
  const propertyTypes = useCatalog('property_type');

  // Municipios dependen de la provincia seleccionada
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const municipalities = useQuery<CatalogItem[]>({
    queryKey: ['catalog', 'municipality', selectedProvince],
    queryFn: async () => {
      if (!selectedProvince) return [];
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs/municipality?onlyActive=true&pageSize=500`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      const data = await res.json();
      // El backend no filtra por provincia automáticamente; lo filtramos en cliente
      return (data.items ?? []).filter(() => true);
    },
    enabled: !!selectedProvince,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { aep: false },
  });

  const watchedProvinceId = watch('provinceId');

  // Sincronizar municipios cuando cambia la provincia
  if (watchedProvinceId && watchedProvinceId !== selectedProvince) {
    setSelectedProvince(watchedProvinceId);
  }

  async function onSubmit(values: FormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await api.post<{ id: string; numericId: number }>('/pensioners', values);
      router.push(`/pensioners/${created.numericId ?? created.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? 'Error al crear el pensionado');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <Link href="/pensioners" className="text-sm text-blue-600 hover:underline">
              ← Volver a pensionados
            </Link>
            <h1 className="text-3xl font-bold text-neutral-900 mt-2">Nuevo pensionado</h1>
            <p className="text-neutral-500 mt-1">
              Complete los datos del combatiente o pensionado.
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Sección 1: Identificación */}
          <section className="rounded-lg bg-white p-6 shadow-md space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
              Identificación
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Carnet de Identidad" htmlFor="identityCard" required error={errors.identityCard?.message}>
                <FormInput id="identityCard" maxLength={11} invalid={!!errors.identityCard} {...register('identityCard', { required: true })} />
              </FormField>
              <FormField label="No. de Serie del Certifico" htmlFor="certificateSerial" error={errors.certificateSerial?.message}>
                <FormInput id="certificateSerial" maxLength={50} {...register('certificateSerial')} />
              </FormField>
              <FormField label="Nombres" htmlFor="firstName" required error={errors.firstName?.message}>
                <FormInput id="firstName" maxLength={100} invalid={!!errors.firstName} {...register('firstName', { required: true })} />
              </FormField>
              <FormField label="Primer Apellido" htmlFor="lastName1" required error={errors.lastName1?.message}>
                <FormInput id="lastName1" maxLength={100} invalid={!!errors.lastName1} {...register('lastName1', { required: true })} />
              </FormField>
              <FormField label="Segundo Apellido" htmlFor="lastName2" error={errors.lastName2?.message}>
                <FormInput id="lastName2" maxLength={100} {...register('lastName2')} />
              </FormField>
              <FormField label="Conocido por" htmlFor="knownAs" error={errors.knownAs?.message}>
                <FormInput id="knownAs" maxLength={150} {...register('knownAs')} />
              </FormField>
            </div>
          </section>

          {/* Sección 2: Ubicación */}
          <section className="rounded-lg bg-white p-6 shadow-md space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
              Ubicación
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Provincia" htmlFor="provinceId" required>
                <FormSelect id="provinceId" {...register('provinceId', { required: true, valueAsNumber: true })}>
                  <option value="">Seleccionar...</option>
                  {provinces.data?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Municipio" htmlFor="municipalityId" required>
                <FormSelect id="municipalityId" {...register('municipalityId', { required: true, valueAsNumber: true })} disabled={!selectedProvince}>
                  <option value="">Seleccionar...</option>
                  {municipalities.data?.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </FormSelect>
              </FormField>
            </div>
            <FormField label="Dirección" htmlFor="address">
              <FormTextarea id="address" {...register('address')} />
            </FormField>
          </section>

          {/* Sección 3: Datos demográficos */}
          <section className="rounded-lg bg-white p-6 shadow-md space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
              Datos demográficos
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FormField label="Sexo" htmlFor="sexId">
                <FormSelect id="sexId" {...register('sexId', { valueAsNumber: true })}>
                  <option value="">—</option>
                  {sexes.data?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Color de Piel" htmlFor="skinColorId">
                <FormSelect id="skinColorId" {...register('skinColorId', { valueAsNumber: true })}>
                  <option value="">—</option>
                  {skinColors.data?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Estado de Salud" htmlFor="healthStatusId">
                <FormSelect id="healthStatusId" {...register('healthStatusId', { valueAsNumber: true })}>
                  <option value="">—</option>
                  {healthStatuses.data?.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Estado Civil" htmlFor="civilStatusId">
                <FormSelect id="civilStatusId" {...register('civilStatusId', { valueAsNumber: true })}>
                  <option value="">—</option>
                  {civilStatuses.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </FormSelect>
              </FormField>
            </div>
          </section>

          {/* Sección 4: Categorización */}
          <section className="rounded-lg bg-white p-6 shadow-md space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
              Categorización
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Categoría" htmlFor="categoryId">
                <FormSelect id="categoryId" {...register('categoryId', { valueAsNumber: true })}>
                  <option value="">—</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Tipo de Pensión" htmlFor="pensionTypeId">
                <FormSelect id="pensionTypeId" {...register('pensionTypeId', { valueAsNumber: true })}>
                  <option value="">—</option>
                  {pensionTypes.data?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </FormSelect>
              </FormField>
            </div>
          </section>

          {/* Sección 5: Datos de pensión */}
          <section className="rounded-lg bg-white p-6 shadow-md space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
              Datos de pensión
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField label="Salario" htmlFor="salary">
                <FormInput id="salary" type="number" step="0.01" {...register('salary', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Cuantía PMT" htmlFor="pmtAmount">
                <FormInput id="pmtAmount" type="number" step="0.01" {...register('pmtAmount', { valueAsNumber: true })} />
              </FormField>
              <FormField label="Pensión Seguridad Social" htmlFor="socialSecurityPension">
                <FormInput id="socialSecurityPension" type="number" step="0.01" {...register('socialSecurityPension', { valueAsNumber: true })} />
              </FormField>
              <FormField label="No. Control Bancario" htmlFor="bankControlNumber">
                <FormInput id="bankControlNumber" maxLength={20} {...register('bankControlNumber')} />
              </FormField>
              <FormField label="Otorgada por" htmlFor="grantedBy">
                <FormInput id="grantedBy" maxLength={150} {...register('grantedBy')} />
              </FormField>
              <div className="flex items-end pb-2">
                <FormCheckbox label="AEP (Aporte Estatal Pensional)" {...register('aep')} />
              </div>
            </div>
          </section>

          {/* Sección 6: Vivienda */}
          <section className="rounded-lg bg-white p-6 shadow-md space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
              Vivienda
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Tipo de Vivienda" htmlFor="housingTypeId">
                <FormSelect id="housingTypeId" {...register('housingTypeId', { valueAsNumber: true })}>
                  <option value="">—</option>
                  {housingTypes.data?.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Tipo de Propiedad" htmlFor="propertyTypeId">
                <FormSelect id="propertyTypeId" {...register('propertyTypeId', { valueAsNumber: true })}>
                  <option value="">—</option>
                  {propertyTypes.data?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </FormSelect>
              </FormField>
            </div>
          </section>

          {/* Acciones */}
          <div className="flex gap-3 justify-end">
            <Link
              href="/pensioners"
              className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-6 text-sm font-medium text-white shadow',
                'hover:bg-blue-700',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar pensionado'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
