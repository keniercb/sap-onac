import Link from 'next/link';

export default function AdminPage() {
  const sections = [
    { href: '/admin/users', title: 'Usuarios', description: 'Gestión de usuarios, roles y territorios', icon: '👤' },
    { href: '/admin/audit-log', title: 'Auditoría', description: 'Log inmutable de operaciones con hash encadenado', icon: '📜' },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-neutral-900">Administración</h1>
          <p className="text-neutral-500 mt-2">
            Usuarios, roles, permisos, auditoría y configuración del sistema.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="block rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <h2 className="text-lg font-semibold text-neutral-900">{s.title}</h2>
              <p className="text-sm text-neutral-500 mt-1">{s.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
