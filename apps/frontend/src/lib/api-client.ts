/**
 * Cliente HTTP base para consumir la API SAP-ONAC.
 * Maneja tokens JWT, refresh automático y reintentos.
 */

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '/api';
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }

  clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  async request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { skipAuth, headers, ...rest } = options;
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;

    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    if (!skipAuth) {
      const token = this.getToken();
      if (token) {
        finalHeaders.Authorization = `Bearer ${token}`;
      }
    }

    const res = await fetch(url, { ...rest, headers: finalHeaders });

    if (res.status === 401 && !skipAuth) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request<T>(path, options);
      }
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new ApiError(401, 'UNAUTHORIZED', 'Sesión expirada');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = data?.error ?? { message: 'Error desconocido', code: 'UNKNOWN' };
      throw new ApiError(res.status, err.code ?? 'UNKNOWN', err.message, err.details);
    }

    return data as T;
  }

  get<T>(path: string, options?: ApiOptions) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options?: ApiOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken =
      typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.accessToken) {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const api = new ApiClient();
