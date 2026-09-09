# Changelog

## [Unreleased]

### Added — Fase 1 (MVP)
- Backend: CRUD completo de Catalogs (nomencladores genéricos para 11 catálogos).
- Backend: CRUD completo de Pensioners con validación de CI cubano, optimistic locking, y auto-creación de movimiento de alta inicial.
- Frontend: página de listado de pensionados con búsqueda y paginación.
- Frontend: formulario multi-sección para crear pensionado (6 secciones: identificación, ubicación, demografía, categorización, pensión, vivienda).
- Frontend: página de detalle del pensionado.
- Frontend: página de catálogos con listado y CRUD de items (modal create/edit, toggle active, delete).

### Added — Fase 0 (Setup)
- Estructura inicial del monorepo con pnpm workspaces + Turborepo.
- Skeleton del backend NestJS 10 con módulo de autenticación (JWT + 2FA TOTP).
- Skeleton del frontend Next.js 16 con shadcn/ui y Tailwind CSS 4.
- Configuración de Prisma 5 con esquema inicial del modelo de datos.
- Infraestructura Docker Compose para desarrollo local (MySQL 8, Redis 7, Mailhog).
- Pipeline de CI con GitHub Actions (lint, typecheck, test, build, CodeQL).
- Documentación inicial: 3 ADRs publicados.
- Plantillas de PR, issues y CODEOWNERS.
