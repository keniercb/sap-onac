import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">SAP-ONAC</h1>
        <p className="text-lg text-neutral-600">
          Sistema de Atención a Pensionados — Oficina Nacional de Atención a Combatientes
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/auth/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-8 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
          >
            Ir al panel
          </Link>
        </div>
        <p className="text-xs text-neutral-400 pt-8">
          v0.1.0 — Fase 1 (MVP: Nomencladores + Pensionados). Build {new Date().toISOString().slice(0, 10)}
        </p>
      </div>
    </main>
  );
}
