# ADR-002: Monorepo con pnpm + Turborepo

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 2026-09-09 |

## Decisión

Adoptar **monorepo** con **pnpm workspaces + Turborepo**.

Estructura:

```
sap-onac/
├── apps/
│   ├── backend/        # NestJS
│   └── frontend/       # Next.js 16
├── packages/
│   ├── shared-config/
│   ├── shared-types/
│   ├── shared-schemas/
│   └── ui-kit/
├── infra/
└── docs/
```

## Justificación

- Tipos y esquemas compartidos sin publicación manual.
- CI unificado: un solo pipeline lint+test+build cubre todo el proyecto.
- Turborepo permite caché local y remoto de builds, acelerando el CI.
