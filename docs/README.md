# Documentación — SAP-ONAC

## Documentos funcionales

- [Requisitos funcionales](01-requisitos-funcionales.md) — Especificación de requisitos (8 módulos, 100+ RF, 5 CU, RNF, reglas de negocio).
- [Plan de desarrollo](02-plan-desarrollo.md) — Plan de desarrollo con 7 fases (39 semanas), stack tecnológico y CI/CD.
- [Modelo de datos](03-modelos-datos.md) — Modelo de datos con 34 entidades y nomencladores.

## Decisiones de arquitectura (ADR)

| ADR | Título | Estado |
|---|---|---|
| [ADR-001](adr/ADR-001-stack-tecnologico.md) | Selección de Stack Tecnológico | Aceptado |
| [ADR-002](adr/ADR-002-monorepo.md) | Monorepo con pnpm + Turborepo | Aceptado |
| [ADR-003](adr/ADR-003-rbac.md) | Control de Acceso Basado en Roles | Aceptado |

## API

La documentación OpenAPI se genera automáticamente con `@nestjs/swagger` y está disponible en:

- **Local**: http://localhost:4000/docs
- **Staging**: https://staging.sap-onac.onac.cu/docs
- **Producción**: https://sap-onac.onac.cu/docs
