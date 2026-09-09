'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@sap-onac/ui-kit';

export const dynamic = 'force-dynamic';

interface AuditEntry {
  id: string;
  numericId: number;
  userId: string | null;
  userName: string | null;
  userUsername: string | null;
  action: string;
  entityType: string;
  entityId: number | null;
  entityUuid: string | null;
  occurredAt: string;
  ipAddress: string;
  recordHash: string;
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Crear',
  update: 'Actualizar',
  delete: 'Eliminar',
  export: 'Exportar',
  login: 'Login',
  logout: 'Logout',
  failed_login: 'Login fallido',
  view_sensitive: 'Ver sensible',
};

const ACTION_STYLES: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  export: 'bg-amber-100 text-amber-800',
  login: 'bg-neutral-100 text-neutral-700',
  logout: 'bg-neutral-100 text-neutral-700',
  failed_login: 'bg-red-50 text-red-700',
  view_sensitive: 'bg-purple-100 text-purple-800',
};

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
  });

  const { data, isLoading } = useQuery<Paginated<AuditEntry>>({
    queryKey: ['audit-log', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.action) params.set('action', filters.action);
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      params.set('page', String(page));
      params.set('pageSize', '50');
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/audit?${params}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok) throw new Error('Error al cargar auditoría');
      return res.json();
    },
  });

  const columns: DataTableColumn<AuditEntry>[] = [
    { key: 'occurredAt', header: 'Fecha/Hora', width: '180px', render: (e) => formatDateTime(e.occurredAt) },
    {
      key: 'action',
      header: 'Acción',
      width: '120px',
      render: (e) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_STYLES[e.action] ?? 'bg-neutral-100 text-neutral-700'}`}>
          {ACTION_LABELS[e.action] ?? e.action}
        </span>
      ),
    },
    { key: 'entityType', header: 'Entidad', width: '120px', render: (e) => <span className="font-mono text-xs">{e.entityType}</span> },
    { key: 'entityId', header: 'ID', width: '80px', render: (e) => e.entityId ?? '—' },
    {
      key: 'userName',
      header: 'Usuario',
      render: (e) => (
        <span className="text-sm">
          {e.userName ?? '—'}
          {e.userUsername && <span className="text-neutral-400 ml-1">@{e.userUsername}</span>}
        </span>
      ),
    },
    { key: 'ipAddress', header: 'IP', width: '140px', render: (e) => <span className="font-mono text-xs">{e.ipAddress}</span> },
    {
      key: 'recordHash',
      header: 'Hash',
      width: '120px',
      render: (e) => <span className="font-mono text-xs text-neutral-400" title={e.recordHash}>{e.recordHash.slice(0, 8)}...</span>,
    },
  ];

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-blue-600 hover:underline">
              ← Volver a administración
            </Link>
            <h1 className="text-3xl font-bold text-neutral-900 mt-2">Log de Auditoría</h1>
            <p className="text-neutral-500 mt-1">
              Registro inmutable de operaciones con hash encadenado (estilo blockchain).
            </p>
          </div>
        </header>

        <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <input
            type="text"
            placeholder="User ID"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className="h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm"
          />
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Todas las acciones</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filters.entityType}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            className="h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Todas las entidades</option>
            <option value="pensioner">Pensionado</option>
            <option value="user">Usuario</option>
            <option value="catalog_item">Ítem catálogo</option>
            <option value="movement">Movimiento</option>
            <option value="session">Sesión</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-neutral-800 px-4 text-sm font-medium text-white hover:bg-neutral-900"
          >
            Filtrar
          </button>
        </form>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          emptyMessage="No hay entradas de auditoría con los filtros seleccionados"
        />

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              Total: <strong>{data.total}</strong> — Página {data.page} de {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, data.page - 1))}
                disabled={data.page <= 1}
                className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(data.totalPages, data.page + 1))}
                disabled={data.page >= data.totalPages}
                className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
