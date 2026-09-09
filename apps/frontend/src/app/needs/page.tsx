'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '@sap-onac/ui-kit';

export const dynamic = 'force-dynamic';

interface Need {
  id: string;
  numericId: number;
  pensionerId: number;
  pensionerName: string | null;
  pensionerIdentityCard: string | null;
  pensionerProvince: string | null;
  pensionerMunicipality: string | null;
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
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En gestión',
  resolved: 'Resuelta',
  cancelled: 'Cancelada',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  cancelled: 'bg-neutral-100 text-neutral-600',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-neutral-100 text-neutral-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-red-100 text-red-800',
};

export default function NeedsPage() {
  const [status, setStatus] = useState('pending,in_progress');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<Paginated<Need>>({
    queryKey: ['needs', status, priority, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '50');
      // Para soportar múltiples estados, hacemos fetch individual por estado
      const statuses = status.split(',').filter(Boolean);
      const allItems: Need[] = [];
      for (const s of statuses) {
        const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/needs?status=${s}&page=1&pageSize=100${priority ? `&priority=${priority}` : ''}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
        });
        if (res.ok) {
          const data = await res.json();
          allItems.push(...(data.items ?? []));
        }
      }
      // Ordenar por prioridad desc y fecha desc
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      allItems.sort((a, b) => {
        const pDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 0);
        if (pDiff !== 0) return pDiff;
        return (b.identifiedAt ?? '').localeCompare(a.identifiedAt ?? '');
      });
      return {
        items: allItems,
        total: allItems.length,
        page: 1,
        pageSize: 100,
        totalPages: 1,
      };
    },
  });

  const columns: DataTableColumn<Need>[] = [
    {
      key: 'pensionerName',
      header: 'Pensionado',
      render: (n) => (
        <Link href={`/pensioners/${n.pensionerId}`} className="font-medium text-blue-600 hover:underline">
          {n.pensionerName ?? '—'}
        </Link>
      ),
    },
    { key: 'pensionerIdentityCard', header: 'CI', width: '120px' },
    {
      key: 'needTypeName',
      header: 'Tipo',
      width: '120px',
      render: (n) => (
        <span className="text-xs">
          {n.needTypeName}
          {n.electrodomesticTypeName && (
            <span className="block text-neutral-500">{n.electrodomesticTypeName} ×{n.quantity}</span>
          )}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (n) => <span className="text-sm">{n.description.length > 80 ? n.description.slice(0, 80) + '...' : n.description}</span>,
    },
    {
      key: 'priority',
      header: 'Prioridad',
      width: '100px',
      render: (n) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[n.priority] ?? PRIORITY_STYLES.medium}`}>
          {PRIORITY_LABELS[n.priority] ?? n.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      width: '110px',
      render: (n) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[n.status] ?? STATUS_STYLES.pending}`}>
          {STATUS_LABELS[n.status] ?? n.status}
        </span>
      ),
    },
    {
      key: 'assignedToName',
      header: 'Responsable',
      width: '140px',
      render: (n) => n.assignedToName ?? <span className="text-neutral-400">Sin asignar</span>,
    },
    {
      key: 'identifiedAt',
      header: 'Identificada',
      width: '120px',
      render: (n) => (n.identifiedAt ? formatDate(n.identifiedAt) : '—'),
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-neutral-900">Atención al Combatiente</h1>
          <p className="text-neutral-500 mt-1">
            Tablero de necesidades abiertas y en gestión.
          </p>
        </header>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {[
              { key: 'pending,in_progress', label: 'Abiertas' },
              { key: 'resolved', label: 'Resueltas' },
              { key: 'cancelled', label: 'Canceladas' },
              { key: '', label: 'Todas' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
                className={`h-9 px-4 rounded-md text-sm font-medium ${
                  status === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Todas las prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          emptyMessage="No hay necesidades con los filtros seleccionados"
        />

        {data && data.items.length > 0 && (
          <p className="text-sm text-neutral-500">
            Total: <strong>{data.total}</strong> necesidad(es)
          </p>
        )}
      </div>
    </main>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
