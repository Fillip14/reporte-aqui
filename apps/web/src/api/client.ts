export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, details?: unknown) {
    super(code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let currentAccessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

export function setRefreshHandler(handler: (() => Promise<string | null>) | null): void {
  refreshHandler = handler;
}

interface ApiFetchOptions extends RequestInit {
  skipAuthRetry?: boolean;
}

async function rawFetch(path: string, options: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  return fetch(`/api${path}`, { ...options, headers, credentials: 'include' });
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? 'unknown_error', body.details);
  }
  return body as T;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuthRetry, ...fetchOptions } = options;
  const res = await rawFetch(path, fetchOptions);

  if (res.status === 401 && !skipAuthRetry && refreshHandler) {
    const newToken = await refreshHandler();
    if (newToken) {
      const retryRes = await rawFetch(path, fetchOptions);
      return parseResponse<T>(retryRes);
    }
  }

  return parseResponse<T>(res);
}
