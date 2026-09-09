'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

export const dynamic = 'force-dynamic';

interface Pensioner {
  id: string;
  numericId: number;
  consecutiveNumber: number;
  identityCard: string;
  certificateSerial: string | null;
  firstName: string;
  lastName1: string;
  lastName2: string | null;
  knownAs: string | null;
  fullName: string;
  displayName: string;
  address: string | null;
  province: { id: number; name: string; code: string } | null;
  municipality: { id: number; name: string; code: string } | null;
  sex: { id: number; name: string; code: string } | null;
  skinColor: { id: number; name: string; code: string } | null;
  healthStatus: { id: number; name: string; code: string } | null;
  category: { id: number; name: string; code: string } | null;
  civilStatus: { id: number; name: string; code: string } | null;
  laborLink: { id: number; name: string; code: string } | null;
  pensionType: { id: number; name: string; code: string } | null;
  housingType: { id: number; name: string; code: string } | null;
  propertyType: { id: number; name: string; code: string } | null;
  salary: number | null;
  aep: boolean | null;
  pmtAmount: number | null;
  socialSecurityPension: number | null;
  bankControlNumber: string | null;
  grantedBy: string | null;
  currentState: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export default function PensionerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: pensioner, isLoading, error } = useQuery<Pensioner>({
    queryKey: ['pensioner', id],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/pensioners/${id}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok) throw new Error('Pensionado no encontrado');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-8">
        <div className="mx-auto max-w-5xl text-neutral-500">Cargando pensionado...</div>
      </main>
    );
  }

  if (error || !pensioner) {
    return (
      <main className="min-h-screen bg-neutral-50 p-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/pensioners" className="text-sm text-blue-600 hover:underline">
            ← Volver a pensionados
          </Link>
          <div className="mt-8 rounded-md bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">Error: pensionado no encontrado</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <Link href="/pensioners" className="text-sm text-blue-600 hover:underline">
              ← Volver a pensionados
            </Link>
            <h1 className="text-3xl font-bold text-neutral-900 mt-2">{pensioner.displayName}</h1>
            <p className="text-neutral-500">
              No. {pensioner.consecutiveNumber} · CI: {pensioner.identityCard}
            </p>
          </div>
          <StateBadge state={pensioner.currentState} />
        </header>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 border-b border-neutral-200 pb-2">
            Datos personales
          </h2>
          <dl className="grid gap-x-6 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Nombres" value={pensioner.firstName} />
            <Field label="Primer Apellido" value={pensioner.lastName1} />
            <Field label="Segundo Apellido" value={pensioner.lastName2 ?? '—'} />
            <Field label="Conocido por" value={pensioner.knownAs ?? '—'} />
            <Field label="No. Certifico" value={pensioner.certificateSerial ?? '—'} />
            <Field label="Sexo" value={pensioner.sex?.name ?? '—'} />
            <Field label="Color de piel" value={pensioner.skinColor?.name ?? '—'} />
            <Field label="Estado civil" value={pensioner.civilStatus?.name ?? '—'} />
            <Field label="Estado de salud" value={pensioner.healthStatus?.name ?? '—'} />
          </dl>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 border-b border-neutral-200 pb-2">
            Ubicación
          </h2>
          <dl className="grid gap-x-6 gap-y-3 md:grid-cols-3">
            <Field label="Provincia" value={pensioner.province?.name ?? '—'} />
            <Field label="Municipio" value={pensioner.municipality?.name ?? '—'} />
            <Field label="Dirección" value={pensioner.address ?? '—'} />
          </dl>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 border-b border-neutral-200 pb-2">
            Categorización y pensión
          </h2>
          <dl className="grid gap-x-6 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Categoría" value={pensioner.category?.name ?? '—'} />
            <Field label="Tipo de pensión" value={pensioner.pensionType?.name ?? '—'} />
            <Field label="Otorgada por" value={pensioner.grantedBy ?? '—'} />
            <Field label="Salario" value={pensioner.salary ? `${pensioner.salary} CUP` : '—'} />
            <Field label="Cuantía PMT" value={pensioner.pmtAmount ? `${pensioner.pmtAmount} CUP` : '—'} />
            <Field label="Pensión SS" value={pensioner.socialSecurityPension ? `${pensioner.socialSecurityPension} CUP` : '—'} />
            <Field label="AEP" value={pensioner.aep ? 'Sí' : 'No'} />
            <Field label="No. Control Bancario" value={pensioner.bankControlNumber ?? '—'} />
          </dl>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 border-b border-neutral-200 pb-2">
            Vivienda
          </h2>
          <dl className="grid gap-x-6 gap-y-3 md:grid-cols-2">
            <Field label="Tipo de vivienda" value={pensioner.housingType?.name ?? '—'} />
            <Field label="Tipo de propiedad" value={pensioner.propertyType?.name ?? '—'} />
          </dl>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 border-b border-neutral-200 pb-2">
            Auditoría
          </h2>
          <dl className="grid gap-x-6 gap-y-3 md:grid-cols-3">
            <Field label="Fecha de creación" value={formatDate(pensioner.createdAt)} />
            <Field label="Última actualización" value={formatDate(pensioner.updatedAt)} />
            <Field label="Versión" value={String(pensioner.version)} />
          </dl>
        </section>

        <div className="flex justify-end gap-3">
          <Link
            href="/pensioners"
            className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 bg-white px-6 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Volver
          </Link>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

function StateBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-neutral-100 text-neutral-800',
    deceased: 'bg-neutral-200 text-neutral-700',
    reincorporated_sma: 'bg-blue-100 text-blue-800',
  };
  const labels: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    deceased: 'Fallecido',
    reincorporated_sma: 'Reincorporado SMA',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${styles[state] ?? styles.inactive}`}
    >
      {labels[state] ?? state}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
