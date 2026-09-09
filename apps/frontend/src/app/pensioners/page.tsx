'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@sap-onac/ui-kit';
import { api, ApiError } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

interface PensionerListItem {
  id: string;
  numericId: number;
  consecutiveNumber: number;
  identityCard: string;
  fullName: string;
  displayName: string;
  address: string | null;
  province: { id: number; name: string } | null;
  municipality: { id: number; name: string } | null;
  category: { id: number; name: string } | null;
  currentState: string;
  createdAt: string;
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function PensionersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error } = useQuery<Paginated<PensionerListItem>>({
    queryKey: ['pensioners', search, page],
    queryFn: () =>
      api.get('/pensioners', {
        // Los parámetros van en la URL; api-client no los procesa, los pegamos aquí
      }).then(async () => {
        // Implementación manual con fetch para soportar query params
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/pensioners?${params}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
            },
          },
        );
        if (res.status === 401) {
          router.push('/auth/login');
          throw new Error('No autorizado');
        }
        return res.json() as Promise<Paginated<PensionerListItem>>;
      }),
  });

  const columns: DataTableColumn<PensionerListItem>[] = [
    { key: 'consecutiveNumber', header: 'No.', width: '60px' },
    { key: 'identityCard', header: 'CI', width: '120px' },
    {
      key: 'fullName',
      header: 'Nombre completo',
      render: (row) => (
        <span className="font-medium">
          {row.displayName !== row.fullName ? (
            <>
              {row.fullName} <span className="text-neutral-400">({row.displayName})</span>
            </>
          ) : (
            row.fullName
          )}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (row) => row.category?.name ?? '—',
    },
    {
      key: 'province',
      header: 'Provincia',
      render: (row) => row.province?.name ?? '—',
    },
    {
      key: 'currentState',
      header: 'Estado',
      render: (row) => <StateBadge state={row.currentState} />,
    },
    { key: 'createdAt', header: 'Creado', render: (row) => formatDate(row.createdAt) },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Pensionados</h1>
            <p className="text-neutral-500 mt-1">
              Gestión de combatientes y pensionados registrados en el sistema.
            </p>
          </div>
          <Link
            href="/pensioners/new"
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            + Nuevo pensionado
          </Link>
        </header>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por CI, nombre o alias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-neutral-800 px-4 text-sm font-medium text-white hover:bg-neutral-900"
          >
            Buscar
          </button>
        </form>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">
              {error instanceof ApiError ? error.message : 'Error al cargar pensionados'}
            </p>
          </div>
        )}

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/pensioners/${row.numericId}`)}
          emptyMessage="No se encontraron pensionados"
        />

        {data && data.totalPages > 1 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onChange={setPage}
          />
        )}
      </div>
    </main>
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
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[state] ?? styles.inactive}`}
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
  });
}

function Pagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-neutral-500">
        Total: <strong>{total}</strong> — Página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
