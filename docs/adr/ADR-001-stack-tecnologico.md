# ADR-001: Selección de Stack Tecnológico

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 2026-09-09 |

## Decisión

| Capa | Tecnología |
|---|---|
| Backend | NestJS 10 (Node.js 20 LTS) |
| ORM | Prisma 5 |
| Base de datos | MySQL 8.0 / MariaDB 10.11+ |
| Cache | Redis 7 |
| Frontend | Next.js 16 (App Router) + React 19 |
| UI | shadcn/ui + Tailwind CSS 4 |
| Estado | Zustand + TanStack Query |
| Formularios | React Hook Form + Zod |
| Auth | JWT (access + refresh) + TOTP 2FA |
| Monorepo | pnpm + Turborepo |
| Contenedores | Docker + Docker Compose |
| CI/CD | GitHub Actions |

## Justificación

- Soberanía de datos: despliegue on-premise Cuba, sin proveedores cloud sancionados.
- TypeScript end-to-end permite compartir tipos y esquemas Zod entre FE y BE.
- Equipo pequeño (3-6 devs): stack con curva de aprendizaje razonable.
