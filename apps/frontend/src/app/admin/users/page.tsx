'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, type DataTableColumn, FormField, FormInput, FormSelect, cn } from '@sap-onac/ui-kit';

export const dynamic = 'force-dynamic';

interface User {
  id: string;
  numericId: string;
  username: string;
  email: string | null;
  fullName: string;
  position: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  forcePasswordChange: boolean;
  lastLoginAt: string | null;
  roles: Array<{ code: string; name: string }>;
  territories: Array<{
    roleCode: string;
    roleName: string;
    provinceId: number | null;
    provinceName: string | null;
    municipalityId: number | null;
    municipalityName: string | null;
  }>;
}

interface Role {
  id: number;
  code: string;
  name: string;
}

interface Province {
  id: number;
  code: string;
  name: string;
}

interface Municipality {
  id: number;
  code: string;
  name: string;
  provinceId: number;
}

export default function UsersAdminPage() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<User[]>({
    queryKey: ['users', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/users${params}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok) throw new Error('Error al cargar usuarios');
      return res.json();
    },
  });

  const { data: roles } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/users/roles`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok) throw new Error('Error al cargar roles');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: provinces } = useQuery<Province[]>({
    queryKey: ['catalog', 'province'],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs/province?pageSize=500`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      const data = await res.json();
      return data.items ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const deactivateMutation = useMutation({
    mutationFn: async (user: User) => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/users/${user.id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? 'Error al desactivar');
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const columns: DataTableColumn<User>[] = [
    { key: 'username', header: 'Usuario', width: '140px', render: (u) => <span className="font-mono text-xs">{u.username}</span> },
    { key: 'fullName', header: 'Nombre', render: (u) => <span className="font-medium">{u.fullName}</span> },
    { key: 'email', header: 'Email', render: (u) => u.email ?? '—' },
    {
      key: 'roles',
      header: 'Roles',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((r) => (
            <span
              key={r.code}
              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
            >
              {r.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'territories',
      header: 'Territorio',
      render: (u) => {
        if (u.territories.length === 0) return <span className="text-neutral-400">Nacional</span>;
        return (
          <span className="text-xs">
            {u.territories.map((t) => `${t.municipalityName ?? t.provinceName ?? '—'}`).join(', ')}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Estado',
      width: '90px',
      render: (u) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            u.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {u.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '160px',
      render: (u) => (
        <div className="flex gap-2">
          <button
            onClick={() => setEditingUser(u)}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Editar
          </button>
          {u.isActive && (
            <button
              onClick={() => {
                if (confirm(`¿Desactivar usuario "${u.username}"?`)) {
                  deactivateMutation.mutate(u);
                }
              }}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Desactivar
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-blue-600 hover:underline">
              ← Volver a administración
            </Link>
            <h1 className="text-3xl font-bold text-neutral-900 mt-2">Usuarios</h1>
            <p className="text-neutral-500 mt-1">
              Gestión de usuarios, roles asignados y alcance territorial.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            + Nuevo usuario
          </button>
        </header>

        <input
          type="text"
          placeholder="Buscar por nombre, usuario o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full max-w-md rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {deactivateMutation.isError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">
              Error: {(deactivateMutation.error as Error)?.message}
            </p>
          </div>
        )}

        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          emptyMessage="No hay usuarios"
        />

        {(showCreateForm || editingUser) && (
          <UserFormModal
            user={editingUser}
            roles={roles ?? []}
            provinces={provinces ?? []}
            onClose={() => {
              setShowCreateForm(false);
              setEditingUser(null);
            }}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ['users'] });
              setShowCreateForm(false);
              setEditingUser(null);
            }}
          />
        )}
      </div>
    </main>
  );
}

function UserFormModal({
  user,
  roles,
  provinces,
  onClose,
  onSaved,
}: {
  user: User | null;
  roles: Role[];
  provinces: Province[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<{
    username: string;
    email: string;
    password: string;
    fullName: string;
    position: string;
    roleCodes: string[];
    territories: Array<{ roleCode: string; provinceId?: number; municipalityId?: number }>;
  }>({
    username: user?.username ?? '',
    email: user?.email ?? '',
    password: '',
    fullName: user?.fullName ?? '',
    position: user?.position ?? '',
    roleCodes: user?.roles.map((r) => r.code) ?? [],
    territories: user?.territories.map((t) => ({
      roleCode: t.roleCode,
      provinceId: t.provinceId ?? undefined,
      municipalityId: t.municipalityId ?? undefined,
    })) ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const url = user
        ? `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/users/${user.id}`
        : `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/users`;
      const method = user ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = {
        fullName: form.fullName || undefined,
        email: form.email || undefined,
        position: form.position || undefined,
        roleCodes: form.roleCodes,
        territories: form.territories,
      };
      if (!user) {
        body.username = form.username;
        body.password = form.password;
      }
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

  function toggleRole(code: string) {
    setForm((f) => {
      const has = f.roleCodes.includes(code);
      const newRoleCodes = has ? f.roleCodes.filter((c) => c !== code) : [...f.roleCodes, code];
      // Limpiar territorios de roles ya no seleccionados
      const newTerritories = f.territories.filter((t) => newRoleCodes.includes(t.roleCode));
      // Añadir territorio vacío para roles nuevos (excepto ADMIN_ONAC y AUDITOR)
      for (const rc of newRoleCodes) {
        if (!newTerritories.find((t) => t.roleCode === rc) && rc !== 'ADMIN_ONAC' && rc !== 'AUDITOR') {
          newTerritories.push({ roleCode: rc, provinceId: undefined, municipalityId: undefined });
        }
      }
      return { ...f, roleCodes: newRoleCodes, territories: newTerritories };
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">
          {user ? 'Editar usuario' : 'Nuevo usuario'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!user && (
            <>
              <FormField label="Usuario" required hint="Solo minúsculas, números, puntos y _">
                <FormInput
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  maxLength={50}
                  required
                />
              </FormField>
              <FormField
                label="Contraseña inicial"
                required
                hint="Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo"
              >
                <FormInput
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </FormField>
            </>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Nombre completo" required>
              <FormInput
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                maxLength={255}
                required
              />
            </FormField>
            <FormField label="Email">
              <FormInput
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={150}
              />
            </FormField>
            <FormField label="Cargo">
              <FormInput
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                maxLength={150}
              />
            </FormField>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-900">Roles asignados</label>
            <div className="mt-2 space-y-2">
              {roles.map((role) => (
                <label key={role.code} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.roleCodes.includes(role.code)}
                    onChange={() => toggleRole(role.code)}
                    className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    <strong>{role.name}</strong>
                    <span className="text-neutral-500 ml-2 text-xs">{role.code}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {form.territories.length > 0 && (
            <div>
              <label className="text-sm font-medium text-neutral-900">Territorios asignados</label>
              <div className="mt-2 space-y-2">
                {form.territories.map((t, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-neutral-500">Rol: {t.roleCode}</span>
                      <FormSelect
                        value={t.provinceId ?? ''}
                        onChange={(e) => {
                          const newT = [...form.territories];
                          newT[idx] = {
                            ...newT[idx],
                            provinceId: e.target.value ? Number(e.target.value) : undefined,
                            municipalityId: undefined,
                          };
                          setForm({ ...form, territories: newT });
                        }}
                      >
                        <option value="">— Provincia —</option>
                        {provinces.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </FormSelect>
                    </div>
                    {t.roleCode === 'OPERADOR_MUNICIPAL' && <MunicipalitySelect form={form} setForm={setForm} idx={idx} provinceId={t.provinceId} />}
                  </div>
                ))}
              </div>
            </div>
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

function MunicipalitySelect({
  form,
  setForm,
  idx,
  provinceId,
}: {
  form: { territories: Array<{ roleCode: string; provinceId?: number; municipalityId?: number }> };
  setForm: React.Dispatch<React.SetStateAction<{
    username: string;
    email: string;
    password: string;
    fullName: string;
    position: string;
    roleCodes: string[];
    territories: Array<{ roleCode: string; provinceId?: number; municipalityId?: number }>;
  }>>;
  idx: number;
  provinceId?: number;
}) {
  const { data } = useQuery<Municipality[]>({
    queryKey: ['catalog', 'municipality', provinceId],
    queryFn: async () => {
      if (!provinceId) return [];
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs/municipality?pageSize=500`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      const data = await res.json();
      return (data.items ?? []).filter((m: Municipality) => m.provinceId === provinceId);
    },
    enabled: !!provinceId,
  });

  return (
    <div>
      <span className="text-xs text-neutral-500">Municipio</span>
      <FormSelect
        value={form.territories[idx].municipalityId ?? ''}
        onChange={(e) => {
          const val = e.target.value ? Number(e.target.value) : undefined;
          setForm((prev) => {
            const newT = [...prev.territories];
            newT[idx] = { ...newT[idx], municipalityId: val };
            return { ...prev, territories: newT };
          });
        }}
        disabled={!provinceId}
      >
        <option value="">— Municipio —</option>
        {data?.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </FormSelect>
    </div>
  );
}
