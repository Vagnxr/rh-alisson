/**
 * Cliente HTTP para o backend (NestJS em /api/v1).
 * Base URL: VITE_API_URL ou fallback http://localhost:3004/api/v1
 * Todas as respostas esperadas: { success: true, data: T, columns?: T[] } ou { success: false, error: { message } }
 * Em 401 (nao autorizado): limpa localStorage/sessionStorage e redireciona para /login.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://rh-alisson-api.onrender.com/api/v1';

function clearStorageAndRedirectToLogin(): void {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } finally {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    window.location.href = `${base}/login`;
  }
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

function getTenantId(): string | null {
  try {
    const raw = localStorage.getItem('tenant-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { currentTenant?: { id: string } } };
    return parsed?.state?.currentTenant?.id ?? null;
  } catch {
    return null;
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  columns?: Array<{ id: string; label: string; order: number; isRequired?: boolean }>;
  meta?: { total: number; page: number; perPage: number; totalPages: number };
}

export interface ApiErrorResponse {
  success: false;
  error: { code?: string; message: string; details?: unknown };
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { tenantId?: string | null }
): Promise<ApiResponse<T>> {
  const url = path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const token = getToken();
  const tenantId = options?.tenantId ?? getTenantId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-Id'] = tenantId;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    const isLoginRequest = path.includes('auth/login') || path.includes('login');
    if (!isLoginRequest) {
      clearStorageAndRedirectToLogin();
      throw new Error('Sessao expirada. Redirecionando para o login.');
    }
  }

  const json = (await res.json().catch(() => ({}))) as ApiResponse<T> | ApiErrorResponse;

  if (!res.ok) {
    const err = (json as ApiErrorResponse).error;
    const message = err?.message ?? `Erro ${res.status}`;
    throw new Error(message);
  }

  if ((json as ApiErrorResponse).success === false) {
    const err = (json as ApiErrorResponse).error;
    throw new Error(err?.message ?? 'Erro na resposta da API');
  }

  return json as ApiResponse<T>;
}

export const api = {
  get: <T>(path: string, options?: { tenantId?: string | null; params?: Record<string, string> }) => {
    let p = path;
    if (options?.params && Object.keys(options.params).length > 0) {
      const search = new URLSearchParams(options.params).toString();
      p = path.includes('?') ? `${path}&${search}` : `${path}?${search}`;
    }
    return request<T>('GET', p, undefined, { tenantId: options?.tenantId });
  },

  post: <T>(path: string, body?: unknown, options?: { tenantId?: string | null }) =>
    request<T>('POST', path, body, options),

  patch: <T>(path: string, body?: unknown, options?: { tenantId?: string | null }) =>
    request<T>('PATCH', path, body, options),

  put: <T>(path: string, body?: unknown, options?: { tenantId?: string | null }) =>
    request<T>('PUT', path, body, options),

  delete: <T>(path: string, options?: { tenantId?: string | null }) =>
    request<T>('DELETE', path, undefined, options),
};

export { BASE_URL };
