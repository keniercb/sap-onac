'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FormField, FormInput, FormSelect, FormTextarea, cn } from '@sap-onac/ui-kit';

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

interface Movement {
  id: string;
  numericId: number;
  movementType: 'alta' | 'baja' | 'reincorporacion_sma';
  movementDate: string;
  causeId: number | null;
  causeName: string | null;
  causeDescription: string | null;
  agreementNumber: string | null;
  agreementDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface Cause {
  id: number;
  code: string;
  name: string;
  appliesTo: string;
}

const MOVEMENT_LABELS: Record<string, string> = {
  alta: 'Alta',
  baja: 'Baja',
  reincorporacion_sma: 'Reincorporación SMA',
};

const MOVEMENT_STYLES: Record<string, string> = {
  alta: 'bg-green-100 text-green-800',
  baja: 'bg-red-100 text-red-800',
  reincorporacion_sma: 'bg-blue-100 text-blue-800',
};

export default function PensionerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [showMovementForm, setShowMovementForm] = useState(false);

  const { data: pensioner, isLoading } = useQuery<Pensioner>({
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

  const { data: movements } = useQuery<Movement[]>({
    queryKey: ['pensioner-movements', id],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/movements/pensioner/${id}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok) return [];
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

  if (!pensioner) {
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

        {/* Sección Movimientos */}
        <section className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-2">
            <h2 className="text-lg font-semibold text-neutral-900">Movimientos (altas/bajas/reincorporaciones)</h2>
            <button
              onClick={() => setShowMovementForm(true)}
              className="inline-flex h-8 items-center justify-center rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700"
            >
              + Registrar movimiento
            </button>
          </div>

          {movements && movements.length === 0 ? (
            <p className="text-sm text-neutral-500 py-4">No hay movimientos registrados.</p>
          ) : (
            <div className="space-y-2">
              {movements?.map((m) => (
                <div key={m.id} className="flex items-start gap-3 p-3 border border-neutral-200 rounded-md">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      MOVEMENT_STYLES[m.movementType] ?? 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {MOVEMENT_LABELS[m.movementType] ?? m.movementType}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-neutral-900">
                        {new Date(m.movementDate).toLocaleDateString('es-CU')}
                      </span>
                      {m.causeName && <span className="text-xs text-neutral-500">{m.causeName}</span>}
                      {m.agreementNumber && (
                        <span className="text-xs text-neutral-500">Acuerdo: {m.agreementNumber}</span>
                      )}
                    </div>
                    {m.causeDescription && (
                      <p className="text-xs text-neutral-600 mt-1">{m.causeDescription}</p>
                    )}
                    {m.notes && <p className="text-xs text-neutral-500 italic mt-1">{m.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
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

        {showMovementForm && (
          <MovementFormModal
            pensionerId={pensioner.numericId}
            onClose={() => setShowMovementForm(false)}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['pensioner-movements', id] });
              queryClient.invalidateQueries({ queryKey: ['pensioner', id] });
              setShowMovementForm(false);
            }}
          />
        )}
      </div>
    </main>
  );
}

function MovementFormModal({
  pensionerId,
  onClose,
  onSaved,
}: {
  pensionerId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    movementType: 'alta' as 'alta' | 'baja' | 'reincorporacion_sma',
    movementDate: new Date().toISOString().slice(0, 10),
    causeId: '',
    causeDescription: '',
    agreementNumber: '',
    agreementDate: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: causes } = useQuery<Cause[]>({
    queryKey: ['movement-causes', form.movementType],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/movements/causes?appliesTo=${form.movementType}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/movements`;
      const body = {
        pensionerId,
        movementType: form.movementType,
        movementDate: form.movementDate,
        causeId: form.causeId ? Number(form.causeId) : undefined,
        causeDescription: form.causeDescription || undefined,
        agreementNumber: form.agreementNumber || undefined,
        agreementDate: form.agreementDate || undefined,
        notes: form.notes || undefined,
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? 'Error al crear movimiento');
      }
      return res.json();
    },
    onSuccess: () => onSaved(),
    onError: (err: Error) => setError(err.message),
    onSettled: () => setIsSaving(false),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    createMutation.mutate();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Registrar movimiento</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Tipo de movimiento" required>
            <FormSelect
              value={form.movementType}
              onChange={(e) =>
                setForm({
                  ...form,
                  movementType: e.target.value as 'alta' | 'baja' | 'reincorporacion_sma',
                  causeId: '',
                })
              }
            >
              <option value="alta">Alta</option>
              <option value="baja">Baja</option>
              <option value="reincorporacion_sma">Reincorporación al SMA</option>
            </FormSelect>
          </FormField>

          <FormField label="Fecha del movimiento" required>
            <FormInput
              type="date"
              value={form.movementDate}
              onChange={(e) => setForm({ ...form, movementDate: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Causa">
            <FormSelect
              value={form.causeId}
              onChange={(e) => setForm({ ...form, causeId: e.target.value })}
            >
              <option value="">— Seleccionar causa —</option>
              {causes?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label="Descripción de la causa">
            <FormInput
              value={form.causeDescription}
              onChange={(e) => setForm({ ...form, causeDescription: e.target.value })}
              maxLength={255}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="No. de acuerdo">
              <FormInput
                value={form.agreementNumber}
                onChange={(e) => setForm({ ...form, agreementNumber: e.target.value })}
                maxLength={50}
              />
            </FormField>
            <FormField label="Fecha del acuerdo">
              <FormInput
                type="date"
                value={form.agreementDate}
                onChange={(e) => setForm({ ...form, agreementDate: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Observaciones">
            <FormTextarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </FormField>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-2">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={cn(
                'h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700',
                'disabled:opacity-50',
              )}
            >
              {isSaving ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
        styles[state] ?? styles.inactive
      }`}
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
