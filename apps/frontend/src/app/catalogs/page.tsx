'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

interface CatalogSummary {
  code: string;
  name: string;
  hierarchical: boolean;
}

export const dynamic = 'force-dynamic';

export default function CatalogsPage() {
  const { data, isLoading } = useQuery<CatalogSummary[]>({
    queryKey: ['catalogs'],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/catalogs`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
      });
      if (!res.ok) throw new Error('Error al cargar catálogos');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-neutral-900">Nomencladores</h1>
          <p className="text-neutral-500 mt-1">
            Seleccione un catálogo para gestionar sus valores.
          </p>
        </header>

        {isLoading ? (
          <div className="text-neutral-500">Cargando catálogos...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.map((c) => (
              <Link
                key={c.code}
                href={`/catalogs/${c.code}`}
                className="block rounded-lg bg-white p-5 shadow-md transition-shadow hover:shadow-lg"
              >
                <h3 className="text-base font-semibold text-neutral-900">{c.name}</h3>
                <p className="mt-1 text-xs text-neutral-500 font-mono">{c.code}</p>
                {c.hierarchical && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Jerárquico
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
