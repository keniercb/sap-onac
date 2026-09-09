export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string; details?: unknown };
  timestamp: string;
  path?: string;
}

export type UUID = string;
export type ISODateString = string;

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  occurredAt: ISODateString;
  ipAddress: string | null;
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'login'
  | 'logout'
  | 'failed_login'
  | 'view_sensitive';

export enum SystemRole {
  ADMIN_ONAC = 'ADMIN_ONAC',
  OPERADOR_PROVINCIAL = 'OPERADOR_PROVINCIAL',
  OPERADOR_MUNICIPAL = 'OPERADOR_MUNICIPAL',
  AUDITOR = 'AUDITOR',
}
