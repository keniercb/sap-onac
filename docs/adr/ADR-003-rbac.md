# ADR-003: Control de Acceso Basado en Roles (RBAC)

| Campo | Valor |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 2026-09-09 |

## Decisión

Implementar **RBAC con cuatro roles del sistema** más **asignación territorial por rol**:

| Código | Nombre | Alcance territorial |
|---|---|---|
| `ADMIN_ONAC` | Administrador ONAC | Nacional (NULL/NULL) |
| `OPERADOR_PROVINCIAL` | Operador Provincial | Provincia obligatoria, municipio NULL |
| `OPERADOR_MUNICIPAL` | Operador Municipal | Provincia y municipio obligatorios |
| `AUDITOR` | Auditor / Consulta | Nacional (NULL/NULL), solo lectura |

### Aplicación

- **JWT** con claims: `sub`, `username`, `roles`.
- **RolesGuard** verifica `roles[]` en metadata del handler.
- **TerritoryInterceptor** aplica filtros automáticos a consultas según el alcance del usuario.
- **AuditInterceptor** registra operaciones de escritura en `audit_log`.
