/** Thin, typed boundary to the API. Base URL is env-driven (never hardcoded). */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'feldpro.token';

/** Bearer token persistence (survives reloads). */
export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string | string[],
    public body?: unknown,
  ) {
    super(Array.isArray(message) ? message.join(', ') : message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  const data = (await res.json().catch(() => null)) as
    | (T & { message?: string | string[] })
    | null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.message ?? res.statusText,
      data,
    );
  }
  return data as T;
}

const body = (data: unknown) => JSON.stringify(data);

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: body(data ?? {}) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body(data ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
