'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type DataTableColumn, FormField, FormInput, FormTextarea, cn } from '@sap-onac/ui-kit';

export const dynamic = 'force-dynamic';

interface CatalogItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  province?: { id: number; name: string; code: string } | null;
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function CatalogItemsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showInactive, setShowInactive] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data, isLoading, error } = useQuery<Paginated<CatalogItem>>({
    queryKey: ['catalog', code, search, page, showInactive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('pageSize', '50');
      params.set('onlyActive', String(!showInactive));
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs/${code}?${params}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok) throw new Error('Error al cargar items');
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs/${code}/${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? 'Error al eliminar');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', code] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (item: CatalogItem) => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs/${code}/${item.id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
        },
        body: JSON.stringify({
          isActive: !item.isActive,
          version: 1,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? 'Error al actualizar');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', code] });
    },
  });

  const columns: DataTableColumn<CatalogItem>[] = [
    { key: 'code', header: 'Código', width: '180px', render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: 'name', header: 'Nombre', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'description', header: 'Descripción', render: (r) => r.description ?? '—' },
    { key: 'sortOrder', header: 'Orden', width: '80px' },
    {
      key: 'isActive',
      header: 'Estado',
      width: '100px',
      render: (r) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            r.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {r.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '200px',
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingItem(r);
            }}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleActiveMutation.mutate(r);
            }}
            className="text-xs font-medium text-amber-600 hover:underline"
          >
            {r.isActive ? 'Desactivar' : 'Activar'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`¿Eliminar el item "${r.name}"? Esta acción no se puede deshacer.`)) {
                deleteMutation.mutate(r.id);
              }
            }}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <Link href="/catalogs" className="text-sm text-blue-600 hover:underline">
              ← Volver a catálogos
            </Link>
            <h1 className="text-2xl font-mono font-bold text-neutral-900 mt-2">{code}</h1>
            <p className="text-neutral-500 mt-1">Gestión de items del catálogo.</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            + Nuevo item
          </button>
        </header>

        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-9 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                setShowInactive(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            Mostrar inactivos
          </label>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{(error as Error).message}</p>
          </div>
        )}

        {deleteMutation.isError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">
              Error al eliminar: {(deleteMutation.error as Error)?.message}
            </p>
          </div>
        )}

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          emptyMessage="No hay items en este catálogo"
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

        {(showCreateForm || editingItem) && (
          <ItemFormModal
            code={code}
            item={editingItem}
            onClose={() => {
              setShowCreateForm(false);
              setEditingItem(null);
            }}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['catalog', code] });
              setShowCreateForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </div>
    </main>
  );
}

function ItemFormModal({
  code,
  item,
  onClose,
  onSaved,
}: {
  code: string;
  item: CatalogItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    code: item?.code ?? '',
    name: item?.name ?? '',
    description: item?.description ?? '',
    sortOrder: item?.sortOrder ?? 0,
    isActive: item?.isActive ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const url = item
        ? `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs/${code}/${item.id}`
        : `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs/${code}`;
      const method = item ? 'PATCH' : 'POST';
      const body = item ? { ...form, version: 1 } : form;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? 'Error al guardar');
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
        <h2 className="text-xl font-semibold text-neutral-900">
          {item ? 'Editar item' : 'Nuevo item'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Código" required hint="Mayúsculas, números y _ (ej. PRIMER_CORONEL)">
            <FormInput
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              maxLength={20}
              required
              disabled={!!item}
            />
          </FormField>

          <FormField label="Nombre" required>
            <FormInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={255}
              required
            />
          </FormField>

          <FormField label="Descripción">
            <FormTextarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={2000}
            />
          </FormField>

          <FormField label="Orden">
            <FormInput
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              min={0}
            />
          </FormField>

          {item && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              Activo
            </label>
          )}

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
