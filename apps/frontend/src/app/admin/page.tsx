export default function AdminPage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-neutral-900">Administración</h1>
          <p className="text-neutral-500 mt-2">
            Usuarios, roles, permisos y configuración del sistema.
          </p>
        </header>
        <div className="rounded-lg bg-white p-8 shadow-md text-center">
          <p className="text-neutral-500">
            Este módulo estará disponible en la Fase 2 (Seguridad y Auditoría).
          </p>
        </div>
      </div>
    </main>
  );
}
