# SAP-ONAC — Sistema de Atención a Pensionados

Sistema web para el registro y control de pensionados de la **Oficina Nacional de Atención a Combatientes (ONAC)** de la República de Cuba.

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Backend** | NestJS 10 + TypeScript 5.6 (Node.js 26) |
| **Frontend** | Next.js 16 (App Router) + React 19 |
| **UI** | shadcn/ui + Tailwind CSS 4 |
| **ORM** | Prisma 5 |
| **Base de datos** | MySQL 8.0 / MariaDB 10.11+ |
| **Cache** | Redis 7 |
| **Monorepo** | pnpm workspaces + Turborepo |
| **Contenedores** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions (runners self-hosted) |

## Requisitos previos

- Node.js 26.2+ (recomendado usar `nvm`), pnpm 9+, Docker 24+, Git 2.40+

## Inicio rápido

```bash
git clone https://github.com/keniercb/sap-onac.git
cd sap-onac
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
docker compose -f infra/docker/docker-compose.dev.yml up -d
pnpm --filter @sap-onac/backend db:generate
pnpm --filter @sap-onac/backend db:migrate:dev
pnpm --filter @sap-onac/backend db:seed
pnpm dev
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api |
| Swagger | http://localhost:4000/docs |
| Mailhog | http://localhost:8025 |

### Credenciales iniciales

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin.onac` | `ChangeMe!2026` | Administrador ONAC |

## Documentación

- [Requisitos funcionales](docs/01-requisitos-funcionales.md)
- [Plan de desarrollo](docs/02-plan-desarrollo.md)
- [Modelo de datos](docs/03-modelos-datos.md)
- [ADRs](docs/adr/)
