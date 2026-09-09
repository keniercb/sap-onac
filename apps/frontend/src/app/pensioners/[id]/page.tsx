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

        {/* Sección Necesidades */}
        <PensionerNeedsSection pensionerId={pensioner.numericId} />

        {/* Sección Problemas Resueltos */}
        <PensionerSolvedProblemsSection pensionerId={pensioner.numericId} />

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

// =====================================================
// Sección de Necesidades del pensionado
// =====================================================

interface Need {
  id: string;
  numericId: number;
  needTypeName: string | null;
  needTypeCode: string | null;
  electrodomesticTypeName: string | null;
  quantity: number;
  description: string;
  priority: string;
  status: string;
  assignedToName: string | null;
  identifiedAt: string | null;
  targetDate: string | null;
  resolvedAt: string | null;
  resolutionJustification: string | null;
  version: number;
}

const NEED_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En gestión',
  resolved: 'Resuelta',
  cancelled: 'Cancelada',
};

const NEED_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  cancelled: 'bg-neutral-100 text-neutral-600',
};

const NEED_PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

function PensionerNeedsSection({ pensionerId }: { pensionerId: number }) {
  const [showForm, setShowForm] = useState(false);

  const { data: needs, refetch } = useQuery<Need[]>({
    queryKey: ['pensioner-needs', pensionerId],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/needs/pensioner/${pensionerId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <section className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-2">
        <h2 className="text-lg font-semibold text-neutral-900">Necesidades</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex h-8 items-center justify-center rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700"
        >
          + Nueva necesidad
        </button>
      </div>

      {!needs || needs.length === 0 ? (
        <p className="text-sm text-neutral-500 py-4">No hay necesidades registradas.</p>
      ) : (
        <div className="space-y-2">
          {needs.map((n) => (
            <div key={n.id} className="flex items-start gap-3 p-3 border border-neutral-200 rounded-md">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  NEED_STATUS_STYLES[n.status] ?? 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {NEED_STATUS_LABELS[n.status] ?? n.status}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900">
                    {n.needTypeName}
                    {n.electrodomesticTypeName && (
                      <span className="text-neutral-500"> · {n.electrodomesticTypeName} ×{n.quantity}</span>
                    )}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
                    {NEED_PRIORITY_LABELS[n.priority] ?? n.priority}
                  </span>
                </div>
                <p className="text-sm text-neutral-700 mt-1">{n.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                  <span>Identificada: {n.identifiedAt ? formatDateShort(n.identifiedAt) : '—'}</span>
                  {n.targetDate && <span>Objetivo: {formatDateShort(n.targetDate)}</span>}
                  {n.assignedToName && <span>Resp.: {n.assignedToName}</span>}
                  {n.resolvedAt && <span>Resuelta: {formatDateShort(n.resolvedAt)}</span>}
                </div>
                {n.resolutionJustification && (
                  <p className="text-xs text-neutral-600 italic mt-1">→ {n.resolutionJustification}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <NeedFormModal
          pensionerId={pensionerId}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            refetch();
            setShowForm(false);
          }}
        />
      )}
    </section>
  );
}

function NeedFormModal({
  pensionerId,
  onClose,
  onSaved,
}: {
  pensionerId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    needTypeId: '',
    electrodomesticTypeId: '',
    quantity: '1',
    description: '',
    priority: 'medium',
    identifiedAt: new Date().toISOString().slice(0, 10),
    targetDate: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: needTypes } = useQuery<Array<{ id: number; code: string; name: string }>>({
    queryKey: ['catalog', 'need_type'],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs/need_type?pageSize=100`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      const data = await res.json();
      return data.items ?? [];
    },
  });

  const { data: electrodomestics } = useQuery<Array<{ id: number; code: string; name: string }>>({
    queryKey: ['catalog', 'electrodomestic'],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs/electrodomestic?pageSize=100`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      const data = await res.json();
      return data.items ?? [];
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/needs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
        },
        body: JSON.stringify({
          pensionerId,
          needTypeId: Number(form.needTypeId),
          electrodomesticTypeId: form.electrodomesticTypeId ? Number(form.electrodomesticTypeId) : undefined,
          quantity: Number(form.quantity),
          description: form.description,
          priority: form.priority,
          identifiedAt: form.identifiedAt,
          targetDate: form.targetDate || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? 'Error al crear necesidad');
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  const isElectrodomestic = needTypes?.find((t) => t.id === Number(form.needTypeId))?.code === 'ELECTRODOMESTICOS';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Nueva necesidad</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Tipo de necesidad" required>
            <FormSelect
              value={form.needTypeId}
              onChange={(e) => setForm({ ...form, needTypeId: e.target.value })}
              required
            >
              <option value="">— Seleccionar —</option>
              {needTypes?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </FormSelect>
          </FormField>

          {isElectrodomestic && (
            <>
              <FormField label="Electrodoméstico" required>
                <FormSelect
                  value={form.electrodomesticTypeId}
                  onChange={(e) => setForm({ ...form, electrodomesticTypeId: e.target.value })}
                  required
                >
                  <option value="">— Seleccionar —</option>
                  {electrodomestics?.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Cantidad">
                <FormInput
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  min={1}
                />
              </FormField>
            </>
          )}

          <FormField label="Descripción" required>
            <FormTextarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              maxLength={2000}
            />
          </FormField>

          <FormField label="Prioridad" required>
            <FormSelect
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </FormSelect>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Fecha identificación">
              <FormInput
                type="date"
                value={form.identifiedAt}
                onChange={(e) => setForm({ ...form, identifiedAt: e.target.value })}
              />
            </FormField>
            <FormField label="Fecha objetivo">
              <FormInput
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              />
            </FormField>
          </div>

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
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// Sección de Problemas Resueltos del pensionado
// =====================================================

interface SolvedProblem {
  id: string;
  numericId: number;
  description: string;
  solutionType: string | null;
  resolutionDate: string;
  responsibleName: string | null;
  notes: string | null;
}

function PensionerSolvedProblemsSection({ pensionerId }: { pensionerId: number }) {
  const [showForm, setShowForm] = useState(false);

  const { data: problems, refetch } = useQuery<SolvedProblem[]>({
    queryKey: ['pensioner-solved-problems', pensionerId],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/solved-problems/pensioner/${pensionerId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <section className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-2">
        <h2 className="text-lg font-semibold text-neutral-900">Problemas resueltos</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex h-8 items-center justify-center rounded-md bg-green-600 px-3 text-xs font-medium text-white hover:bg-green-700"
        >
          + Registrar problema resuelto
        </button>
      </div>

      {!problems || problems.length === 0 ? (
        <p className="text-sm text-neutral-500 py-4">No hay problemas resueltos registrados.</p>
      ) : (
        <div className="space-y-2">
          {problems.map((p) => (
            <div key={p.id} className="flex items-start gap-3 p-3 border border-neutral-200 rounded-md">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Resuelto
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900">
                    {formatDateShort(p.resolutionDate)}
                  </span>
                  {p.solutionType && (
                    <span className="text-xs text-neutral-500">{p.solutionType}</span>
                  )}
                  {p.responsibleName && (
                    <span className="text-xs text-neutral-500">Resp.: {p.responsibleName}</span>
                  )}
                </div>
                <p className="text-sm text-neutral-700 mt-1">{p.description}</p>
                {p.notes && <p className="text-xs text-neutral-500 italic mt-1">{p.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SolvedProblemFormModal
          pensionerId={pensionerId}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            refetch();
            setShowForm(false);
          }}
        />
      )}
    </section>
  );
}

function SolvedProblemFormModal({
  pensionerId,
  onClose,
  onSaved,
}: {
  pensionerId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    description: '',
    solutionType: '',
    resolutionDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/solved-problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
        },
        body: JSON.stringify({
          pensionerId,
          description: form.description,
          solutionType: form.solutionType || undefined,
          resolutionDate: form.resolutionDate,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? 'Error al crear problema resuelto');
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Registrar problema resuelto</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Descripción del problema" required>
            <FormTextarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              maxLength={2000}
            />
          </FormField>

          <FormField label="Tipo de solución">
            <FormInput
              value={form.solutionType}
              onChange={(e) => setForm({ ...form, solutionType: e.target.value })}
              maxLength={100}
              placeholder="Ej: Gestión ante institución, entrega de material..."
            />
          </FormField>

          <FormField label="Fecha de resolución" required>
            <FormInput
              type="date"
              value={form.resolutionDate}
              onChange={(e) => setForm({ ...form, resolutionDate: e.target.value })}
              required
            />
          </FormField>

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
                'h-9 rounded-md bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700',
                'disabled:opacity-50',
              )}
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
