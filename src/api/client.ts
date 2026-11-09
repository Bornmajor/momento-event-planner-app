import { ApiError, NetworkError } from './errors';

export interface AuthHooks {
  /** The current access token, or null (signed out, or restored offline without one yet). */
  getAccessToken: () => string | null;
  /**
   * Gets a new access token using the stored refresh token. Rejects with ApiError(401) when the session is over,
   * or NetworkError when the server can't be reached (the session is kept).
   */
  refreshAccessToken: () => Promise<string>;
}

export interface ApiClientOptions {
  baseUrl: string;
  auth: AuthHooks;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  query?: Query;
  /** Send the access token (default true). Public endpoints pass false. */
  auth?: boolean;
}

function buildUrl(baseUrl: string, path: string, query?: Query) {
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return `${baseUrl.replace(/\/$/, '')}${path}${params ? `?${params}` : ''}`;
}

/**
 * A small fetch wrapper (spec §5): JSON in and out, the Bearer token, the ngrok header, a timeout, typed errors, and a
 * single shared token refresh when requests get 401. One refresh at a time matters: the backend treats a reused
 * refresh token as theft and ends the session.
 */
export function createApiClient({ baseUrl, auth, fetchFn = fetch, timeoutMs = 15_000 }: ApiClientOptions) {
  let refreshing: Promise<string> | null = null;

  function refreshOnce(): Promise<string> {
    refreshing ??= auth.refreshAccessToken().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  async function send(method: string, url: string, body: unknown, token: string | null): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchFn(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw new NetworkError();
    } finally {
      clearTimeout(timer);
    }
  }

  async function parse<T>(response: Response): Promise<T> {
    const text = await response.text();
    const data: unknown = text ? safeJson(text) : undefined;
    if (response.ok) return data as T;

    const error = (data as { error?: { code?: string; message?: string; details?: unknown } } | undefined)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? `Request failed with status ${response.status}`,
      error?.details,
    );
  }

  async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const useAuth = options.auth !== false;
    const url = buildUrl(baseUrl, path, options.query);

    let response = await send(method, url, body, useAuth ? auth.getAccessToken() : null);
    if (response.status === 401 && useAuth) {
      const token = await refreshOnce(); // rejects with ApiError(401) or NetworkError
      response = await send(method, url, body, token);
    }
    return parse<T>(response);
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body ?? {}, options),
    patch: <T>(path: string, body: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
    delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
