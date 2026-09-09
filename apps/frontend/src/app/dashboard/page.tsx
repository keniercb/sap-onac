import Link from 'next/link';

export default function DashboardPage() {
  const modules = [
    { href: '/pensioners', title: 'Pensionados', description: 'Gestión de combatientes y pensionados', icon: '👥' },
    { href: '/needs', title: 'Atención al Combatiente', description: 'Necesidades y problemas resueltos', icon: '🤝' },
    { href: '/catalogs', title: 'Nomencladores', description: 'Administración de catálogos', icon: '📚' },
    { href: '/admin', title: 'Administración', description: 'Usuarios, roles, auditoría y configuración', icon: '⚙️' },
    { href: '/admin/users', title: 'Usuarios', description: 'Gestión de usuarios y roles', icon: '👤' },
    { href: '/admin/audit-log', title: 'Auditoría', description: 'Log inmutable de operaciones', icon: '📜' },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-neutral-900">Panel principal</h1>
          <p className="text-neutral-500">
            Bienvenido al Sistema de Atención a Pensionados ONAC
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="block rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="text-3xl mb-2">{m.icon}</div>
              <h2 className="text-lg font-semibold text-neutral-900">{m.title}</h2>
              <p className="text-sm text-neutral-500 mt-1">{m.description}</p>
            </Link>
          ))}
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Indicadores</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Pensionados activos" value="—" />
            <StatCard label="Altas del mes" value="—" />
            <StatCard label="Bajas del mes" value="—" />
            <StatCard label="Fallecimientos" value="—" />
          </div>
          <p className="text-xs text-neutral-400 mt-4">
            Los indicadores se cargarán cuando el backend esté en línea.
          </p>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-neutral-200 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
    </div>
  );
}
