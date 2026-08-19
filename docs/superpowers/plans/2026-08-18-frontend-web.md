# Frontend Web (apps/web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first frontend (`apps/web`) for reporte-aqui-2 — a React + Vite + TypeScript SPA covering registration, login, the problem feed, problem detail with all conditional actions, problem creation with media upload, and profile management.

**Architecture:** A single Vite-built SPA, routed with React Router, backed by TanStack Query over a thin `fetch` wrapper. The backend (`apps/api`) uses Bearer-token auth (access token in the JSON body, refresh token in an httpOnly cookie) — the access token lives only in an in-memory module variable on the client, never in `localStorage`. The Vite dev server proxies `/api/*` to the API (stripping the prefix), which sidesteps the API's lack of CORS config and keeps API calls from colliding with the SPA's own `/problems/:id`-style routes.

**Tech Stack:** React 19, Vite 8, TypeScript 5.9, React Router 7, TanStack Query 5, Tailwind CSS 4 (via `@tailwindcss/vite`), Vitest 4 + Testing Library + MSW 2.

**Spec:** [docs/superpowers/specs/2026-08-18-frontend-web-design.md](../specs/2026-08-18-frontend-web-design.md)

## Global Constraints

- All code identifiers, file/folder names, and URL route paths are in English. Only UI-facing text (labels, messages) is in Portuguese.
- New package: `@reporte-aqui/web` at `apps/web`, picked up automatically by the existing `pnpm-workspace.yaml` (`apps/*`).
- The access token is never persisted (no `localStorage`/`sessionStorage`) — it lives in a module-level variable in `src/api/client.ts` for the lifetime of the page.
- Every API call from the SPA goes through `apiFetch` (`src/api/client.ts`), which prefixes paths with `/api`. Never call `fetch('/auth/...')` etc. directly — the `/api` prefix is what the Vite dev proxy strips before forwarding to `http://localhost:3000`.
- Uploading a file to the presigned R2 URL is the one exception: that `fetch` goes straight to the absolute `uploadUrl` returned by the API, not through `apiFetch`.
- No admin screens, no real deployment config, no geolocation/map, no E2E tests in this plan.
- Every task ships with tests (Vitest + Testing Library + MSW) covering its own deliverable.
- Run all commands from the repo root as `pnpm --filter @reporte-aqui/web <script>` unless noted otherwise.

---

### Task 1: Scaffold apps/web

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/index.css`
- Create: `apps/web/src/test/setup.ts`
- Test: `apps/web/src/App.test.tsx`

**Interfaces:**
- Produces: `App` — default-exported React component (`apps/web/src/App.tsx`), rendered at the DOM root by `main.tsx`. Later tasks replace its contents but keep it as the single default export other files never import from directly (only `main.tsx` mounts it).

- [ ] **Step 1: Create the package scaffold files**

`apps/web/package.json`:
```json
{
  "name": "@reporte-aqui/web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router-dom": "^7.18.2",
    "@tanstack/react-query": "^5.101.4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.5",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^6.0.5",
    "jsdom": "^30.0.1",
    "msw": "^2.15.0",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.9.3",
    "vite": "^8.2.1",
    "vitest": "^4.1.11"
  }
}
```

`apps/web/vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
  },
});
```

`apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "noEmit": true,
    "isolatedModules": true,
    "types": ["vite/client", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

`apps/web/index.html`:
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reporte Aqui</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Install dependencies**

Run (from repo root): `pnpm install`
Expected: pnpm links the new `@reporte-aqui/web` workspace package and installs its dependencies.

- [ ] **Step 3: Write the failing smoke test**

`apps/web/src/App.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the app placeholder', () => {
    render(<App />);
    expect(screen.getByText('Reporte Aqui')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: FAIL — `./App` cannot be resolved (no `App.tsx` yet).

- [ ] **Step 5: Implement the app shell**

`apps/web/src/App.tsx`:
```tsx
export default function App() {
  return <div>Reporte Aqui</div>;
}
```

`apps/web/src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`apps/web/src/index.css`:
```css
@import "tailwindcss";
```

`apps/web/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: PASS

- [ ] **Step 7: Run typecheck**

Run: `pnpm --filter @reporte-aqui/web typecheck`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add apps/web
git commit -m "feat(web): scaffold apps/web with Vite, React, TypeScript, Tailwind"
```

---

### Task 2: API client core

**Files:**
- Create: `apps/web/src/api/client.ts`
- Create: `apps/web/src/test/server.ts`
- Modify: `apps/web/src/test/setup.ts`
- Test: `apps/web/src/api/client.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `class ApiError extends Error { status: number; code: string; details?: unknown }`
  - `function setAccessToken(token: string | null): void`
  - `function setRefreshHandler(handler: (() => Promise<string | null>) | null): void`
  - `function apiFetch<T>(path: string, options?: RequestInit & { skipAuthRetry?: boolean }): Promise<T>` — prefixes `path` with `/api`, attaches `Authorization: Bearer <token>` when a token is set, retries once via the refresh handler on a 401 (unless `skipAuthRetry` is set), returns `undefined` for 204 responses, throws `ApiError` for any non-ok response.
  - `server` (`apps/web/src/test/server.ts`) — an MSW `setupServer()` instance every later test imports to register handlers with `server.use(...)`.

- [ ] **Step 1: Create the MSW test server and wire it into setup**

`apps/web/src/test/server.ts`:
```ts
import { setupServer } from 'msw/node';

export const server = setupServer();
```

`apps/web/src/test/setup.ts` (replace the Task 1 content):
```ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 2: Write the failing tests**

`apps/web/src/api/client.test.ts`:
```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { apiFetch, ApiError, setAccessToken, setRefreshHandler } from './client';

describe('apiFetch', () => {
  beforeEach(() => {
    setAccessToken(null);
    setRefreshHandler(null);
  });

  it('sends the access token as a Bearer header when set', async () => {
    setAccessToken('token-123');
    let receivedAuth: string | null = null;
    server.use(
      http.get('/api/ping', ({ request }) => {
        receivedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiFetch('/ping');
    expect(receivedAuth).toBe('Bearer token-123');
  });

  it('omits the Authorization header when no token is set', async () => {
    let receivedAuth: string | null = 'unset';
    server.use(
      http.get('/api/ping', ({ request }) => {
        receivedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiFetch('/ping');
    expect(receivedAuth).toBeNull();
  });

  it('retries once after a successful refresh on 401', async () => {
    let callCount = 0;
    server.use(
      http.get('/api/secure', () => {
        callCount += 1;
        return callCount === 1
          ? HttpResponse.json({ error: 'invalid_token' }, { status: 401 })
          : HttpResponse.json({ ok: true });
      }),
    );
    setRefreshHandler(async () => {
      setAccessToken('new-token');
      return 'new-token';
    });

    const result = await apiFetch<{ ok: boolean }>('/secure');
    expect(result).toEqual({ ok: true });
    expect(callCount).toBe(2);
  });

  it('throws ApiError when refresh fails to produce a new token', async () => {
    server.use(
      http.get('/api/secure', () => HttpResponse.json({ error: 'invalid_token' }, { status: 401 })),
    );
    setRefreshHandler(async () => null);

    await expect(apiFetch('/secure')).rejects.toBeInstanceOf(ApiError);
  });

  it('does not call the refresh handler when skipAuthRetry is set', async () => {
    const refreshHandler = vi.fn(async () => 'token');
    setRefreshHandler(refreshHandler);
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ error: 'invalid_refresh_token' }, { status: 401 }),
      ),
    );

    await expect(
      apiFetch('/auth/refresh', { method: 'POST', skipAuthRetry: true }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(refreshHandler).not.toHaveBeenCalled();
  });

  it('throws ApiError immediately for non-401 errors', async () => {
    server.use(http.get('/api/missing', () => HttpResponse.json({ error: 'not_found' }, { status: 404 })));

    await expect(apiFetch('/missing')).rejects.toMatchObject({ status: 404, code: 'not_found' });
  });

  it('returns undefined for 204 responses', async () => {
    server.use(http.delete('/api/thing', () => new HttpResponse(null, { status: 204 })));

    const result = await apiFetch('/thing', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: FAIL — `./client` cannot be resolved.

- [ ] **Step 4: Implement the client**

`apps/web/src/api/client.ts`:
```ts
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: PASS

- [ ] **Step 6: Run typecheck**

Run: `pnpm --filter @reporte-aqui/web typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): add API client with token storage and refresh-retry"
```

---

### Task 3: Auth API + AuthContext boot flow

**Files:**
- Create: `apps/web/src/api/auth.ts`
- Create: `apps/web/src/auth/AuthContext.tsx`
- Modify: `apps/web/src/main.tsx`
- Test: `apps/web/src/api/auth.test.ts`
- Test: `apps/web/src/auth/AuthContext.test.tsx`

**Interfaces:**
- Consumes: `apiFetch`, `ApiError`, `setAccessToken`, `setRefreshHandler` from `../api/client` (Task 2).
- Produces:
  - `type UserRole = 'individual' | 'company' | 'admin'`
  - `interface AuthUser { id: string; email: string; role: UserRole }`
  - `interface AuthResult { user: AuthUser; accessToken: string }`
  - `function registerIndividual(input: { email: string; password: string; fullName: string }): Promise<AuthResult>`
  - `function registerCompany(input: { email: string; password: string; companyName: string; cnpj: string }): Promise<AuthResult>`
  - `function login(input: { email: string; password: string }): Promise<AuthResult>`
  - `function refreshSession(): Promise<AuthResult>`
  - `function logout(): Promise<void>`
  - `AuthProvider` (component, `../auth/AuthContext`) and `useAuth(): { user: AuthUser | null; isLoading: boolean; setSession: (result: AuthResult) => void; logout: () => Promise<void> }`

- [ ] **Step 1: Write the failing tests**

`apps/web/src/api/auth.test.ts`:
```tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { login, registerIndividual, registerCompany, refreshSession, logout } from './auth';

describe('auth api', () => {
  it('login posts credentials and returns the session', async () => {
    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ email: 'a@b.com', password: 'secret123' });
        return HttpResponse.json({
          user: { id: '1', email: 'a@b.com', role: 'individual' },
          accessToken: 'token',
        });
      }),
    );

    const result = await login({ email: 'a@b.com', password: 'secret123' });
    expect(result.user.email).toBe('a@b.com');
    expect(result.accessToken).toBe('token');
  });

  it('registerIndividual posts to the individual endpoint', async () => {
    server.use(
      http.post('/api/auth/register/individual', () =>
        HttpResponse.json(
          { user: { id: '1', email: 'a@b.com', role: 'individual' }, accessToken: 'token' },
          { status: 201 },
        ),
      ),
    );

    const result = await registerIndividual({ email: 'a@b.com', password: 'secret123', fullName: 'Ana' });
    expect(result.user.role).toBe('individual');
  });

  it('registerCompany posts to the company endpoint', async () => {
    server.use(
      http.post('/api/auth/register/company', () =>
        HttpResponse.json(
          { user: { id: '2', email: 'c@b.com', role: 'company' }, accessToken: 'token' },
          { status: 201 },
        ),
      ),
    );

    const result = await registerCompany({
      email: 'c@b.com',
      password: 'secret123',
      companyName: 'Acme',
      cnpj: '12345678901234',
    });
    expect(result.user.role).toBe('company');
  });

  it('refreshSession posts with no body and returns the session', async () => {
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ user: { id: '1', email: 'a@b.com', role: 'individual' }, accessToken: 'new-token' }),
      ),
    );

    const result = await refreshSession();
    expect(result.accessToken).toBe('new-token');
  });

  it('logout returns void on 204', async () => {
    server.use(http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })));
    await expect(logout()).resolves.toBeUndefined();
  });
});
```

`apps/web/src/auth/AuthContext.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../test/server';
import { AuthProvider, useAuth } from './AuthContext';

function Consumer() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p>loading</p>;
  return <p>{user ? `logged in: ${user.email}` : 'logged out'}</p>;
}

function renderConsumer() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AuthProvider boot', () => {
  it('sets user to null when the refresh cookie is missing', async () => {
    server.use(
      http.post('/api/auth/refresh', () => HttpResponse.json({ error: 'missing_refresh_token' }, { status: 401 })),
    );

    renderConsumer();
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument());
  });

  it('sets user from a successful boot refresh', async () => {
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ user: { id: '1', email: 'a@b.com', role: 'individual' }, accessToken: 'token' }),
      ),
    );

    renderConsumer();
    await waitFor(() => expect(screen.getByText('logged in: a@b.com')).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: FAIL — `./auth` and `./AuthContext` cannot be resolved.

- [ ] **Step 3: Implement the auth API module**

`apps/web/src/api/auth.ts`:
```ts
import { apiFetch } from './client';

export type UserRole = 'individual' | 'company' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

export function registerIndividual(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/register/individual', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuthRetry: true,
  });
}

export function registerCompany(input: {
  email: string;
  password: string;
  companyName: string;
  cnpj: string;
}): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/register/company', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuthRetry: true,
  });
}

export function login(input: { email: string; password: string }): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
    skipAuthRetry: true,
  });
}

export function refreshSession(): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/refresh', { method: 'POST', skipAuthRetry: true });
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST', skipAuthRetry: true });
}
```

- [ ] **Step 4: Implement AuthContext**

`apps/web/src/auth/AuthContext.tsx`:
```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setAccessToken, setRefreshHandler } from '../api/client';
import { refreshSession, logout as logoutApi, type AuthUser, type AuthResult } from '../api/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  setSession: (result: AuthResult) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    setRefreshHandler(async () => {
      try {
        const result = await refreshSession();
        setAccessToken(result.accessToken);
        setUser(result.user);
        return result.accessToken;
      } catch {
        setAccessToken(null);
        setUser(null);
        return null;
      }
    });

    refreshSession()
      .then((result) => {
        setAccessToken(result.accessToken);
        setUser(result.user);
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  function setSession(result: AuthResult) {
    setAccessToken(result.accessToken);
    setUser(result.user);
  }

  async function logout() {
    await logoutApi();
    setAccessToken(null);
    setUser(null);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setSession, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 5: Wire AuthProvider and QueryClientProvider into main.tsx**

`apps/web/src/main.tsx` (replace):
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: PASS (App.test.tsx from Task 1 still passes unchanged — it renders `<App/>` directly, and App's placeholder doesn't use `useAuth`).

- [ ] **Step 7: Run typecheck**

Run: `pnpm --filter @reporte-aqui/web typecheck`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add apps/web
git commit -m "feat(web): add auth API and AuthContext boot/refresh flow"
```

---

### Task 4: Routing, Register and Login pages

**Files:**
- Create: `apps/web/src/test/renderWithProviders.tsx`
- Create: `apps/web/src/test/authMocks.ts`
- Create: `apps/web/src/pages/RegisterPage.tsx`
- Create: `apps/web/src/pages/LoginPage.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/pages/RegisterPage.test.tsx`
- Test: `apps/web/src/pages/LoginPage.test.tsx`

**Interfaces:**
- Consumes: `registerIndividual`, `registerCompany`, `login`, `AuthUser` from `../api/auth` (Task 3); `ApiError` from `../api/client` (Task 2); `useAuth` from `../auth/AuthContext` (Task 3).
- Produces:
  - `function renderWithProviders(ui: ReactElement, options?: { route?: string; path?: string }): RenderResult` (`../test/renderWithProviders`) — wraps `ui` in a fresh `QueryClientProvider` + `AuthProvider` + `MemoryRouter`. When `path` is given, `ui` is wrapped in `<Routes><Route path={path} element={ui} /></Routes>` so `useParams()` works; otherwise `ui` is rendered directly.
  - `function mockLoggedOut(): void` and `function mockLoggedIn(user: AuthUser, accessToken?: string): void` (`../test/authMocks`) — register the `POST /api/auth/refresh` MSW handler every `renderWithProviders`-based test needs (the boot effect always calls it).
  - Route table in `App.tsx`: `/`, `/register`, `/login` (more routes added by later tasks).

- [ ] **Step 1: Create the shared test helpers**

`apps/web/src/test/renderWithProviders.tsx`:
```tsx
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path }: { route?: string; path?: string } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          {path ? (
            <Routes>
              <Route path={path} element={ui} />
            </Routes>
          ) : (
            ui
          )}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
```

`apps/web/src/test/authMocks.ts`:
```ts
import { http, HttpResponse } from 'msw';
import { server } from './server';
import type { AuthUser } from '../api/auth';

export function mockLoggedOut() {
  server.use(
    http.post('/api/auth/refresh', () => HttpResponse.json({ error: 'missing_refresh_token' }, { status: 401 })),
  );
}

export function mockLoggedIn(user: AuthUser, accessToken = 'test-access-token') {
  server.use(http.post('/api/auth/refresh', () => HttpResponse.json({ user, accessToken })));
}
```

- [ ] **Step 2: Write the failing tests**

`apps/web/src/pages/RegisterPage.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedOut } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import RegisterPage from './RegisterPage';

describe('RegisterPage', () => {
  it('registers an individual and redirects home', async () => {
    mockLoggedOut();
    server.use(
      http.post('/api/auth/register/individual', () =>
        HttpResponse.json(
          { user: { id: '1', email: 'a@b.com', role: 'individual' }, accessToken: 'token' },
          { status: 201 },
        ),
      ),
    );

    renderWithProviders(<RegisterPage />, { route: '/register' });

    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123');
    await userEvent.type(screen.getByLabelText('Nome completo'), 'Ana');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('shows an error when the email is already registered', async () => {
    mockLoggedOut();
    server.use(
      http.post('/api/auth/register/individual', () =>
        HttpResponse.json({ error: 'email_already_registered' }, { status: 409 }),
      ),
    );

    renderWithProviders(<RegisterPage />, { route: '/register' });

    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123');
    await userEvent.type(screen.getByLabelText('Nome completo'), 'Ana');
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este e-mail já está cadastrado.');
  });

  it('switches to the company fields when selecting empresa', async () => {
    mockLoggedOut();
    renderWithProviders(<RegisterPage />, { route: '/register' });

    await userEvent.click(screen.getByLabelText('Empresa'));

    expect(screen.getByLabelText('Nome da empresa')).toBeInTheDocument();
    expect(screen.getByLabelText('CNPJ')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome completo')).not.toBeInTheDocument();
  });
});
```

`apps/web/src/pages/LoginPage.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedOut } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('logs in with valid credentials', async () => {
    mockLoggedOut();
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ user: { id: '1', email: 'a@b.com', role: 'individual' }, accessToken: 'token' }),
      ),
    );

    renderWithProviders(<LoginPage />, { route: '/login' });

    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('shows an error on invalid credentials', async () => {
    mockLoggedOut();
    server.use(
      http.post('/api/auth/login', () => HttpResponse.json({ error: 'invalid_credentials' }, { status: 401 })),
    );

    renderWithProviders(<LoginPage />, { route: '/login' });

    await userEvent.type(screen.getByLabelText('E-mail'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.');
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: FAIL — `./RegisterPage` and `./LoginPage` cannot be resolved.

- [ ] **Step 4: Implement RegisterPage**

`apps/web/src/pages/RegisterPage.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerIndividual, registerCompany } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type AccountType = 'individual' | 'company';

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'email_already_registered':
        return 'Este e-mail já está cadastrado.';
      case 'cnpj_already_registered':
        return 'Este CNPJ já está cadastrado.';
      case 'invalid_input':
        return 'Verifique os dados informados.';
      default:
        return 'Não foi possível completar o cadastro. Tente novamente.';
    }
  }
  return 'Não foi possível completar o cadastro. Tente novamente.';
}

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result =
        accountType === 'individual'
          ? await registerIndividual({ email, password, fullName })
          : await registerCompany({ email, password, companyName, cnpj });
      setSession(result);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Criar conta</h1>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Tipo de conta</legend>
          <label>
            <input
              type="radio"
              name="accountType"
              value="individual"
              checked={accountType === 'individual'}
              onChange={() => setAccountType('individual')}
            />
            Pessoa física
          </label>
          <label>
            <input
              type="radio"
              name="accountType"
              value="company"
              checked={accountType === 'company'}
              onChange={() => setAccountType('company')}
            />
            Empresa
          </label>
        </fieldset>

        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {accountType === 'individual' ? (
          <>
            <label htmlFor="fullName">Nome completo</label>
            <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </>
        ) : (
          <>
            <label htmlFor="companyName">Nome da empresa</label>
            <input
              id="companyName"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />

            <label htmlFor="cnpj">CNPJ</label>
            <input
              id="cnpj"
              required
              pattern="\d{14}"
              maxLength={14}
              inputMode="numeric"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
            />
          </>
        )}

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          Criar conta
        </button>
      </form>

      <p>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Implement LoginPage**

`apps/web/src/pages/LoginPage.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await login({ email, password });
      setSession(result);
      navigate('/');
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'invalid_credentials'
          ? 'E-mail ou senha inválidos.'
          : 'Não foi possível entrar. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Entrar</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          Entrar
        </button>
      </form>

      <p>
        Não tem conta? <Link to="/register">Criar conta</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Wire routing into App.tsx**

`apps/web/src/App.tsx` (replace):
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Reporte Aqui</div>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: PASS

- [ ] **Step 8: Run typecheck**

Run: `pnpm --filter @reporte-aqui/web typecheck`
Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add apps/web
git commit -m "feat(web): add routing, register and login pages"
```

---

### Task 5: ProtectedRoute + Profile page

**Files:**
- Create: `apps/web/src/auth/ProtectedRoute.tsx`
- Create: `apps/web/src/api/me.ts`
- Create: `apps/web/src/pages/ProfilePage.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/auth/ProtectedRoute.test.tsx`
- Test: `apps/web/src/pages/ProfilePage.test.tsx`

**Interfaces:**
- Consumes: `useAuth` from `../auth/AuthContext` (Task 3); `apiFetch` from `../api/client` (Task 2); `UserRole` from `../api/auth` (Task 3); `renderWithProviders`, `mockLoggedIn`, `mockLoggedOut` from `../test/*` (Task 4).
- Produces:
  - `ProtectedRoute` (component, `../auth/ProtectedRoute`) — renders `children` when `user` is set, redirects to `/login` when not (after `isLoading` resolves).
  - `interface MeProfile { id, email, role, individualProfile: { fullName } | null, companyProfile: { companyName, cnpj, verificationStatus } | null }` and `getMe`/`updateMeIndividual`/`updateMeCompany`/`deleteMe` (`../api/me`).
  - Route `/profile` in `App.tsx`, wrapped in `ProtectedRoute`.

- [ ] **Step 1: Write the failing tests**

`apps/web/src/auth/ProtectedRoute.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { mockLoggedOut, mockLoggedIn } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import { ProtectedRoute } from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects to /login when logged out', async () => {
    mockLoggedOut();
    renderWithProviders(
      <ProtectedRoute>
        <p>secret content</p>
      </ProtectedRoute>,
      { route: '/profile', path: '/profile' },
    );

    await waitFor(() => expect(screen.queryByText('secret content')).not.toBeInTheDocument());
  });

  it('renders children when logged in', async () => {
    mockLoggedIn({ id: '1', email: 'a@b.com', role: 'individual' });
    renderWithProviders(
      <ProtectedRoute>
        <p>secret content</p>
      </ProtectedRoute>,
      { route: '/profile', path: '/profile' },
    );

    await waitFor(() => expect(screen.getByText('secret content')).toBeInTheDocument());
  });
});
```

`apps/web/src/pages/ProfilePage.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedIn } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import ProfilePage from './ProfilePage';

const individualUser = { id: '1', email: 'a@b.com', role: 'individual' as const };

describe('ProfilePage', () => {
  it('shows and updates the individual profile', async () => {
    mockLoggedIn(individualUser);
    server.use(
      http.get('/api/me', () =>
        HttpResponse.json({
          id: '1',
          email: 'a@b.com',
          role: 'individual',
          individualProfile: { fullName: 'Ana' },
          companyProfile: null,
        }),
      ),
      http.patch('/api/me', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ fullName: 'Ana Paula' });
        return HttpResponse.json({
          id: '1',
          email: 'a@b.com',
          role: 'individual',
          individualProfile: { fullName: 'Ana Paula' },
          companyProfile: null,
        });
      }),
    );

    renderWithProviders(<ProfilePage />, { route: '/profile' });

    const input = await screen.findByLabelText('Nome completo');
    expect(input).toHaveValue('Ana');

    await userEvent.clear(input);
    await userEvent.type(input, 'Ana Paula');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(input).toHaveValue('Ana Paula'));
  });

  it('deletes the account and calls logout', async () => {
    mockLoggedIn(individualUser);
    let deleteCalled = false;
    let logoutCalled = false;
    server.use(
      http.get('/api/me', () =>
        HttpResponse.json({
          id: '1',
          email: 'a@b.com',
          role: 'individual',
          individualProfile: { fullName: 'Ana' },
          companyProfile: null,
        }),
      ),
      http.delete('/api/me', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.post('/api/auth/logout', () => {
        logoutCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<ProfilePage />, { route: '/profile' });

    await screen.findByLabelText('Nome completo');
    await userEvent.click(screen.getByRole('button', { name: 'Excluir conta' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    await waitFor(() => expect(logoutCalled).toBe(true));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: FAIL — `./ProtectedRoute`, `../api/me`, `./ProfilePage` cannot be resolved.

- [ ] **Step 3: Implement ProtectedRoute**

`apps/web/src/auth/ProtectedRoute.tsx`:
```tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p>Carregando...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 4: Implement the me API module**

`apps/web/src/api/me.ts`:
```ts
import { apiFetch } from './client';
import type { UserRole } from './auth';

export interface MeProfile {
  id: string;
  email: string;
  role: UserRole;
  individualProfile: { fullName: string } | null;
  companyProfile: {
    companyName: string;
    cnpj: string;
    verificationStatus: 'pending' | 'approved' | 'rejected';
  } | null;
}

export function getMe(): Promise<MeProfile> {
  return apiFetch<MeProfile>('/me');
}

export function updateMeIndividual(input: { fullName: string }): Promise<MeProfile> {
  return apiFetch<MeProfile>('/me', { method: 'PATCH', body: JSON.stringify(input) });
}

export function updateMeCompany(input: { companyName?: string; cnpj?: string }): Promise<MeProfile> {
  return apiFetch<MeProfile>('/me', { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteMe(): Promise<void> {
  return apiFetch<void>('/me', { method: 'DELETE' });
}
```

- [ ] **Step 5: Implement ProfilePage**

`apps/web/src/pages/ProfilePage.tsx`:
```tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateMeIndividual, updateMeCompany, deleteMe } from '../api/me';
import { useAuth } from '../auth/AuthContext';

const VERIFICATION_LABELS = {
  pending: 'Verificação pendente',
  approved: 'Verificada',
  rejected: 'Verificação rejeitada',
};

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.individualProfile?.fullName ?? '');
    setCompanyName(profile.companyProfile?.companyName ?? '');
    setCnpj(profile.companyProfile?.cnpj ?? '');
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () =>
      profile?.role === 'company' ? updateMeCompany({ companyName, cnpj }) : updateMeIndividual({ fullName }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMe,
    onSuccess: async () => {
      await logout();
      navigate('/');
    },
  });

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateMutation.mutate();
  }

  function handleDelete() {
    if (window.confirm('Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.')) {
      deleteMutation.mutate();
    }
  }

  if (isLoading) return <p>Carregando...</p>;
  if (!profile) return <p>Não foi possível carregar o perfil.</p>;

  return (
    <div>
      <h1>Meu perfil</h1>
      <p>{profile.email}</p>

      {profile.companyProfile && <p>{VERIFICATION_LABELS[profile.companyProfile.verificationStatus]}</p>}

      {profile.role !== 'admin' && (
        <form onSubmit={handleSubmit}>
          {profile.role === 'individual' && (
            <>
              <label htmlFor="fullName">Nome completo</label>
              <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </>
          )}

          {profile.role === 'company' && (
            <>
              <label htmlFor="companyName">Nome da empresa</label>
              <input
                id="companyName"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />

              <label htmlFor="cnpj">CNPJ</label>
              <input
                id="cnpj"
                required
                pattern="\d{14}"
                maxLength={14}
                inputMode="numeric"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
              />
            </>
          )}

          <button type="submit" disabled={updateMutation.isPending}>
            Salvar alterações
          </button>
        </form>
      )}

      <button onClick={handleLogout}>Sair</button>
      <button onClick={handleDelete}>Excluir conta</button>
    </div>
  );
}
```

- [ ] **Step 6: Add the /profile route**

`apps/web/src/App.tsx` (replace):
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import { ProtectedRoute } from './auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Reporte Aqui</div>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: PASS

- [ ] **Step 8: Run typecheck**

Run: `pnpm --filter @reporte-aqui/web typecheck`
Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add apps/web
git commit -m "feat(web): add protected routes and profile page"
```

---

### Task 6: Problems API + Media API

**Files:**
- Create: `apps/web/src/api/problems.ts`
- Create: `apps/web/src/api/media.ts`
- Test: `apps/web/src/api/problems.test.ts`
- Test: `apps/web/src/api/media.test.ts`

**Interfaces:**
- Consumes: `apiFetch` from `./client` (Task 2).
- Produces:
  - `type ProblemStatus = 'open' | 'pending_verification' | 'resolved' | 'cancelled'`, `type MediaType = 'image' | 'video'`
  - `interface ProblemMedia { id, objectKey, mediaType, url }`, `interface ProblemRating { id, score, comment }`
  - `interface ProblemListItem { id, authorId, title, description, location, status, resolvedAt, resolvedById, createdAt, updatedAt, media, voteCount, hasVoted }`
  - `interface ProblemDetail extends ProblemListItem { rating: ProblemRating | null }`
  - `listProblems(params?: { status?, q?, sort?, page?, limit? }): Promise<{ items: ProblemListItem[]; page; limit; total }>`
  - `getProblem(id: string): Promise<ProblemDetail>`
  - `toggleVote(id: string): Promise<{ voted: boolean }>`
  - `cancelProblem(id: string): Promise<{ status: ProblemStatus }>`
  - `resolveProblem(id: string): Promise<{ status: ProblemStatus }>`
  - `createResolutionProposal(id: string, objectKey: string): Promise<{ id: string; status: string }>`
  - `rateResolution(id: string, input: { score: number; comment?: string }): Promise<ProblemRating>`
  - `createProblem(input: { title, description, location, media: { objectKey, mediaType }[] }): Promise<ProblemDetail>`
  - `inferMediaType(file: File): MediaType`, `requestUploadUrl(mediaType): Promise<{ objectKey; uploadUrl }>`, `uploadFileToR2(uploadUrl, file): Promise<void>` (goes straight to the absolute `uploadUrl`, not through `apiFetch`), `uploadMedia(file: File): Promise<{ objectKey: string; mediaType: MediaType }>` (`./media`)

- [ ] **Step 1: Write the failing tests**

`apps/web/src/api/problems.test.ts`:
```tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import {
  listProblems,
  getProblem,
  toggleVote,
  cancelProblem,
  resolveProblem,
  createResolutionProposal,
  rateResolution,
  createProblem,
} from './problems';

const sample = {
  id: 'abc',
  authorId: 'u1',
  title: 'Buraco na rua',
  description: 'd'.repeat(20),
  location: 'Rua X',
  status: 'open',
  resolvedAt: null,
  resolvedById: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  media: [],
  voteCount: 0,
  hasVoted: false,
  rating: null,
};

describe('problems api', () => {
  it('listProblems builds the query string from params', async () => {
    server.use(
      http.get('/api/problems', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('status')).toBe('open');
        expect(url.searchParams.get('q')).toBe('buraco');
        expect(url.searchParams.get('sort')).toBe('top');
        return HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 });
      }),
    );

    const result = await listProblems({ status: 'open', q: 'buraco', sort: 'top' });
    expect(result.total).toBe(0);
  });

  it('listProblems omits unset params', async () => {
    server.use(
      http.get('/api/problems', ({ request }) => {
        const url = new URL(request.url);
        expect(url.search).toBe('');
        return HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 });
      }),
    );

    await listProblems();
  });

  it('getProblem fetches a single problem by id', async () => {
    server.use(http.get('/api/problems/abc', () => HttpResponse.json(sample)));

    const problem = await getProblem('abc');
    expect(problem.title).toBe('Buraco na rua');
  });

  it('toggleVote posts to the vote endpoint', async () => {
    server.use(http.post('/api/problems/abc/vote', () => HttpResponse.json({ voted: true })));
    const result = await toggleVote('abc');
    expect(result.voted).toBe(true);
  });

  it('cancelProblem posts to the cancel endpoint', async () => {
    server.use(http.post('/api/problems/abc/cancel', () => HttpResponse.json({ status: 'cancelled' })));
    const result = await cancelProblem('abc');
    expect(result.status).toBe('cancelled');
  });

  it('resolveProblem posts to the resolve endpoint', async () => {
    server.use(http.post('/api/problems/abc/resolve', () => HttpResponse.json({ status: 'resolved' })));
    const result = await resolveProblem('abc');
    expect(result.status).toBe('resolved');
  });

  it('createResolutionProposal sends the objectKey', async () => {
    server.use(
      http.post('/api/problems/abc/resolution-proposals', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ objectKey: 'u1/photo.jpg' });
        return HttpResponse.json({ id: 'p1', status: 'pending' }, { status: 201 });
      }),
    );

    const result = await createResolutionProposal('abc', 'u1/photo.jpg');
    expect(result.status).toBe('pending');
  });

  it('rateResolution sends score and comment', async () => {
    server.use(
      http.post('/api/problems/abc/rating', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ score: 5, comment: 'Ótimo' });
        return HttpResponse.json({ id: 'r1', score: 5, comment: 'Ótimo' }, { status: 201 });
      }),
    );

    const rating = await rateResolution('abc', { score: 5, comment: 'Ótimo' });
    expect(rating.score).toBe(5);
  });

  it('createProblem posts title, description, location and media', async () => {
    server.use(
      http.post('/api/problems', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({
          title: 'Buraco na rua',
          description: 'd'.repeat(20),
          location: 'Rua X',
          media: [{ objectKey: 'u1/a.jpg', mediaType: 'image' }],
        });
        return HttpResponse.json(sample, { status: 201 });
      }),
    );

    const problem = await createProblem({
      title: 'Buraco na rua',
      description: 'd'.repeat(20),
      location: 'Rua X',
      media: [{ objectKey: 'u1/a.jpg', mediaType: 'image' }],
    });
    expect(problem.id).toBe('abc');
  });
});
```

`apps/web/src/api/media.test.ts`:
```tsx
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { inferMediaType, requestUploadUrl, uploadFileToR2, uploadMedia } from './media';

describe('media api', () => {
  it('inferMediaType detects video by mime type', () => {
    const video = new File(['x'], 'clip.mp4', { type: 'video/mp4' });
    const image = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    expect(inferMediaType(video)).toBe('video');
    expect(inferMediaType(image)).toBe('image');
  });

  it('requestUploadUrl posts the mediaType and returns the presigned URL', async () => {
    server.use(
      http.post('/api/media/upload-url', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ mediaType: 'image' });
        return HttpResponse.json({ objectKey: 'u1/a.jpg', uploadUrl: 'https://r2.example.com/u1/a.jpg' });
      }),
    );

    const result = await requestUploadUrl('image');
    expect(result.objectKey).toBe('u1/a.jpg');
  });

  it('uploadFileToR2 PUTs the file to the presigned URL', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    let received = false;
    server.use(
      http.put('https://r2.example.com/u1/a.jpg', () => {
        received = true;
        return new HttpResponse(null, { status: 200 });
      }),
    );

    await uploadFileToR2('https://r2.example.com/u1/a.jpg', file);
    expect(received).toBe(true);
  });

  it('uploadFileToR2 throws when the upload fails', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    server.use(http.put('https://r2.example.com/bad', () => new HttpResponse(null, { status: 500 })));

    await expect(uploadFileToR2('https://r2.example.com/bad', file)).rejects.toThrow();
  });

  it('uploadMedia requests a URL then uploads the file', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    server.use(
      http.post('/api/media/upload-url', () =>
        HttpResponse.json({ objectKey: 'u1/a.jpg', uploadUrl: 'https://r2.example.com/u1/a.jpg' }),
      ),
      http.put('https://r2.example.com/u1/a.jpg', () => new HttpResponse(null, { status: 200 })),
    );

    const result = await uploadMedia(file);
    expect(result).toEqual({ objectKey: 'u1/a.jpg', mediaType: 'image' });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: FAIL — `./problems` and `./media` cannot be resolved.

- [ ] **Step 3: Implement the problems API module**

`apps/web/src/api/problems.ts`:
```ts
import { apiFetch } from './client';

export type ProblemStatus = 'open' | 'pending_verification' | 'resolved' | 'cancelled';
export type MediaType = 'image' | 'video';

export interface ProblemMedia {
  id: string;
  objectKey: string;
  mediaType: MediaType;
  url: string;
}

export interface ProblemRating {
  id: string;
  score: number;
  comment: string | null;
}

export interface ProblemListItem {
  id: string;
  authorId: string;
  title: string;
  description: string;
  location: string;
  status: ProblemStatus;
  resolvedAt: string | null;
  resolvedById: string | null;
  createdAt: string;
  updatedAt: string;
  media: ProblemMedia[];
  voteCount: number;
  hasVoted: boolean;
}

export interface ProblemDetail extends ProblemListItem {
  rating: ProblemRating | null;
}

export interface ListProblemsParams {
  status?: ProblemStatus;
  q?: string;
  sort?: 'newest' | 'top';
  page?: number;
  limit?: number;
}

export interface ListProblemsResult {
  items: ProblemListItem[];
  page: number;
  limit: number;
  total: number;
}

export function listProblems(params: ListProblemsParams = {}): Promise<ListProblemsResult> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.q) query.set('q', params.q);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<ListProblemsResult>(`/problems${qs ? `?${qs}` : ''}`);
}

export function getProblem(id: string): Promise<ProblemDetail> {
  return apiFetch<ProblemDetail>(`/problems/${id}`);
}

export function toggleVote(id: string): Promise<{ voted: boolean }> {
  return apiFetch<{ voted: boolean }>(`/problems/${id}/vote`, { method: 'POST' });
}

export function cancelProblem(id: string): Promise<{ status: ProblemStatus }> {
  return apiFetch<{ status: ProblemStatus }>(`/problems/${id}/cancel`, { method: 'POST' });
}

export function resolveProblem(id: string): Promise<{ status: ProblemStatus }> {
  return apiFetch<{ status: ProblemStatus }>(`/problems/${id}/resolve`, { method: 'POST' });
}

export function createResolutionProposal(id: string, objectKey: string): Promise<{ id: string; status: string }> {
  return apiFetch<{ id: string; status: string }>(`/problems/${id}/resolution-proposals`, {
    method: 'POST',
    body: JSON.stringify({ objectKey }),
  });
}

export function rateResolution(id: string, input: { score: number; comment?: string }): Promise<ProblemRating> {
  return apiFetch<ProblemRating>(`/problems/${id}/rating`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createProblem(input: {
  title: string;
  description: string;
  location: string;
  media: { objectKey: string; mediaType: MediaType }[];
}): Promise<ProblemDetail> {
  return apiFetch<ProblemDetail>('/problems', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
```

- [ ] **Step 4: Implement the media API module**

`apps/web/src/api/media.ts`:
```ts
import { apiFetch } from './client';
import type { MediaType } from './problems';

export function inferMediaType(file: File): MediaType {
  return file.type.startsWith('video/') ? 'video' : 'image';
}

export function requestUploadUrl(mediaType: MediaType): Promise<{ objectKey: string; uploadUrl: string }> {
  return apiFetch<{ objectKey: string; uploadUrl: string }>('/media/upload-url', {
    method: 'POST',
    body: JSON.stringify({ mediaType }),
  });
}

export async function uploadFileToR2(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
}

export async function uploadMedia(file: File): Promise<{ objectKey: string; mediaType: MediaType }> {
  const mediaType = inferMediaType(file);
  const { objectKey, uploadUrl } = await requestUploadUrl(mediaType);
  await uploadFileToR2(uploadUrl, file);
  return { objectKey, mediaType };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: PASS

- [ ] **Step 6: Run typecheck**

Run: `pnpm --filter @reporte-aqui/web typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): add problems and media API clients"
```

---

### Task 7: Feed page

**Files:**
- Create: `apps/web/src/pages/FeedPage.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`
- Test: `apps/web/src/pages/FeedPage.test.tsx`

**Interfaces:**
- Consumes: `listProblems`, `toggleVote`, `ProblemStatus` from `../api/problems` (Task 6); `useAuth` from `../auth/AuthContext` (Task 3).
- Produces: `FeedPage` (default export, `./FeedPage`), mounted at `/`.

- [ ] **Step 1: Write the failing test**

`apps/web/src/pages/FeedPage.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedOut, mockLoggedIn } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import FeedPage from './FeedPage';

const sampleProblem = {
  id: 'abc',
  authorId: 'author-1',
  title: 'Buraco na rua',
  description: 'd'.repeat(20),
  location: 'Rua X',
  status: 'open',
  resolvedAt: null,
  resolvedById: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  media: [],
  voteCount: 3,
  hasVoted: false,
};

describe('FeedPage', () => {
  it('lists problems returned by the API', async () => {
    mockLoggedOut();
    server.use(
      http.get('/api/problems', () => HttpResponse.json({ items: [sampleProblem], page: 1, limit: 20, total: 1 })),
    );

    renderWithProviders(<FeedPage />, { route: '/' });

    expect(await screen.findByText('Buraco na rua')).toBeInTheDocument();
  });

  it('shows the empty state when there are no problems', async () => {
    mockLoggedOut();
    server.use(http.get('/api/problems', () => HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 })));

    renderWithProviders(<FeedPage />, { route: '/' });

    expect(await screen.findByText('Nenhum problema encontrado.')).toBeInTheDocument();
  });

  it('hides the vote button for the problem author', async () => {
    mockLoggedIn({ id: 'author-1', email: 'a@b.com', role: 'individual' });
    server.use(
      http.get('/api/problems', () => HttpResponse.json({ items: [sampleProblem], page: 1, limit: 20, total: 1 })),
    );

    renderWithProviders(<FeedPage />, { route: '/' });

    await screen.findByText('Buraco na rua');
    expect(screen.queryByRole('button', { name: 'Votar' })).not.toBeInTheDocument();
  });

  it('lets a non-author vote', async () => {
    mockLoggedIn({ id: 'voter-1', email: 'v@b.com', role: 'individual' });
    let voteCalled = false;
    server.use(
      http.get('/api/problems', () => HttpResponse.json({ items: [sampleProblem], page: 1, limit: 20, total: 1 })),
      http.post('/api/problems/abc/vote', () => {
        voteCalled = true;
        return HttpResponse.json({ voted: true });
      }),
    );

    renderWithProviders(<FeedPage />, { route: '/' });

    const voteButton = await screen.findByRole('button', { name: 'Votar' });
    await userEvent.click(voteButton);

    await waitFor(() => expect(voteCalled).toBe(true));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: FAIL — `./FeedPage` cannot be resolved.

- [ ] **Step 3: Implement FeedPage**

`apps/web/src/pages/FeedPage.tsx`:
```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProblems, toggleVote, type ProblemStatus } from '../api/problems';
import { useAuth } from '../auth/AuthContext';

const STATUS_LABELS: Record<ProblemStatus, string> = {
  open: 'Aberto',
  pending_verification: 'Aguardando verificação',
  resolved: 'Resolvido',
  cancelled: 'Cancelado',
};

export default function FeedPage() {
  const [status, setStatus] = useState<ProblemStatus | ''>('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'newest' | 'top'>('newest');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['problems', { status, q, sort }],
    queryFn: () => listProblems({ status: status || undefined, q: q || undefined, sort }),
  });

  const voteMutation = useMutation({
    mutationFn: toggleVote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['problems'] }),
  });

  return (
    <div>
      <h1>Problemas reportados</h1>

      <form onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="search">Buscar</label>
        <input id="search" value={q} onChange={(e) => setQ(e.target.value)} />

        <label htmlFor="status">Status</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value as ProblemStatus | '')}>
          <option value="">Todos</option>
          <option value="open">Aberto</option>
          <option value="pending_verification">Aguardando verificação</option>
          <option value="resolved">Resolvido</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <label htmlFor="sort">Ordenar por</label>
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'top')}>
          <option value="newest">Mais recentes</option>
          <option value="top">Mais votados</option>
        </select>
      </form>

      {user && (
        <p>
          <Link to="/problems/new">Reportar problema</Link>
        </p>
      )}

      {isLoading && <p>Carregando...</p>}
      {!isLoading && data?.items.length === 0 && <p>Nenhum problema encontrado.</p>}

      <ul>
        {data?.items.map((problem) => (
          <li key={problem.id}>
            <Link to={`/problems/${problem.id}`}>{problem.title}</Link>
            <span> — {STATUS_LABELS[problem.status]}</span>
            <span> — {problem.voteCount} voto(s)</span>
            {user && user.id !== problem.authorId && (
              <button onClick={() => voteMutation.mutate(problem.id)} disabled={voteMutation.isPending}>
                {problem.hasVoted ? 'Remover voto' : 'Votar'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Replace the "/" route and update the App smoke test**

`apps/web/src/App.tsx` (replace):
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import { ProtectedRoute } from './auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

`apps/web/src/App.test.tsx` (replace — FeedPage needs `AuthProvider`/`QueryClientProvider`, which the Task 1 version didn't provide):
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from './test/server';
import { AuthProvider } from './auth/AuthContext';
import App from './App';

describe('App', () => {
  it('renders the feed at the root route', async () => {
    server.use(
      http.post('/api/auth/refresh', () => HttpResponse.json({ error: 'missing_refresh_token' }, { status: 401 })),
      http.get('/api/problems', () => HttpResponse.json({ items: [], page: 1, limit: 20, total: 0 })),
    );
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Problemas reportados')).toBeInTheDocument());
  });
});
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: PASS

- [ ] **Step 6: Run typecheck**

Run: `pnpm --filter @reporte-aqui/web typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): add problems feed page"
```

---

### Task 8: Problem detail page

**Files:**
- Create: `apps/web/src/pages/ProblemDetailPage.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/pages/ProblemDetailPage.test.tsx`

**Interfaces:**
- Consumes: `getProblem`, `toggleVote`, `cancelProblem`, `resolveProblem`, `createResolutionProposal`, `rateResolution`, `ProblemStatus` from `../api/problems` (Task 6); `uploadMedia` from `../api/media` (Task 6); `useAuth` from `../auth/AuthContext` (Task 3).
- Produces: `ProblemDetailPage` (default export, `./ProblemDetailPage`), mounted at `/problems/:id`.

- [ ] **Step 1: Write the failing test**

`apps/web/src/pages/ProblemDetailPage.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedIn } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import ProblemDetailPage from './ProblemDetailPage';

function problem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'abc',
    authorId: 'author-1',
    title: 'Buraco na rua',
    description: 'd'.repeat(20),
    location: 'Rua X',
    status: 'open',
    resolvedAt: null,
    resolvedById: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    media: [],
    voteCount: 3,
    hasVoted: false,
    rating: null,
    ...overrides,
  };
}

describe('ProblemDetailPage', () => {
  it('shows cancel and resolve for the author on an open problem, hides vote/propose', async () => {
    mockLoggedIn({ id: 'author-1', email: 'a@b.com', role: 'individual' });
    server.use(http.get('/api/problems/abc', () => HttpResponse.json(problem())));

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar como resolvido' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Votar' })).not.toBeInTheDocument();
    expect(screen.queryByText('Propor resolução')).not.toBeInTheDocument();
  });

  it('shows vote and propose-resolution for a non-author on an open problem', async () => {
    mockLoggedIn({ id: 'voter-1', email: 'v@b.com', role: 'individual' });
    server.use(http.get('/api/problems/abc', () => HttpResponse.json(problem())));

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    expect(screen.getByRole('button', { name: 'Votar' })).toBeInTheDocument();
    expect(screen.getByText('Propor resolução')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('submits a resolution proposal by uploading a file first', async () => {
    mockLoggedIn({ id: 'voter-1', email: 'v@b.com', role: 'individual' });
    let proposalCalled = false;
    server.use(
      http.get('/api/problems/abc', () => HttpResponse.json(problem())),
      http.post('/api/media/upload-url', () =>
        HttpResponse.json({ objectKey: 'voter-1/a.jpg', uploadUrl: 'https://r2.example.com/voter-1/a.jpg' }),
      ),
      http.put('https://r2.example.com/voter-1/a.jpg', () => new HttpResponse(null, { status: 200 })),
      http.post('/api/problems/abc/resolution-proposals', async ({ request }) => {
        const body = await request.json();
        expect(body).toEqual({ objectKey: 'voter-1/a.jpg' });
        proposalCalled = true;
        return HttpResponse.json({ id: 'p1', status: 'pending' }, { status: 201 });
      }),
    );

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    await userEvent.upload(screen.getByLabelText('Foto de evidência'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar proposta' }));

    await waitFor(() => expect(proposalCalled).toBe(true));
  });

  it('shows a rating form for the author on a resolved, unrated problem', async () => {
    mockLoggedIn({ id: 'author-1', email: 'a@b.com', role: 'individual' });
    server.use(http.get('/api/problems/abc', () => HttpResponse.json(problem({ status: 'resolved' }))));

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    expect(screen.getByRole('button', { name: 'Enviar avaliação' })).toBeInTheDocument();
  });

  it('shows the existing rating instead of the form when already rated', async () => {
    mockLoggedIn({ id: 'author-1', email: 'a@b.com', role: 'individual' });
    server.use(
      http.get('/api/problems/abc', () =>
        HttpResponse.json(problem({ status: 'resolved', rating: { id: 'r1', score: 4, comment: 'Bom' } })),
      ),
    );

    renderWithProviders(<ProblemDetailPage />, { route: '/problems/abc', path: '/problems/:id' });

    await screen.findByText('Buraco na rua');
    expect(screen.getByText('Nota: 4/5')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar avaliação' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: FAIL — `./ProblemDetailPage` cannot be resolved.

- [ ] **Step 3: Implement ProblemDetailPage**

`apps/web/src/pages/ProblemDetailPage.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProblem,
  toggleVote,
  cancelProblem,
  resolveProblem,
  createResolutionProposal,
  rateResolution,
  type ProblemStatus,
} from '../api/problems';
import { uploadMedia } from '../api/media';
import { useAuth } from '../auth/AuthContext';

const STATUS_LABELS: Record<ProblemStatus, string> = {
  open: 'Aberto',
  pending_verification: 'Aguardando verificação',
  resolved: 'Resolvido',
  cancelled: 'Cancelado',
};

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const problemId = id!;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: problem, isLoading } = useQuery({
    queryKey: ['problem', problemId],
    queryFn: () => getProblem(problemId),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['problem', problemId] });
    queryClient.invalidateQueries({ queryKey: ['problems'] });
  }

  const voteMutation = useMutation({ mutationFn: () => toggleVote(problemId), onSuccess: invalidate });
  const cancelMutation = useMutation({ mutationFn: () => cancelProblem(problemId), onSuccess: invalidate });
  const resolveMutation = useMutation({ mutationFn: () => resolveProblem(problemId), onSuccess: invalidate });

  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const proposalMutation = useMutation({
    mutationFn: async (file: File) => {
      const { objectKey } = await uploadMedia(file);
      return createResolutionProposal(problemId, objectKey);
    },
    onSuccess: () => {
      setProposalFile(null);
      invalidate();
    },
    onError: () => setProposalError('Não foi possível enviar a proposta. Tente novamente.'),
  });

  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const ratingMutation = useMutation({
    mutationFn: () => rateResolution(problemId, { score, comment: comment || undefined }),
    onSuccess: invalidate,
  });

  if (isLoading) return <p>Carregando...</p>;
  if (!problem) return <p>Problema não encontrado.</p>;

  const isAuthor = user?.id === problem.authorId;
  const canVote = !!user && !isAuthor;
  const canCancel = isAuthor && (problem.status === 'open' || problem.status === 'pending_verification');
  const canResolve = isAuthor && problem.status === 'open';
  const canPropose = !!user && !isAuthor && problem.status === 'open';
  const canRate = isAuthor && problem.status === 'resolved' && !problem.rating;

  function handleProposalSubmit(e: FormEvent) {
    e.preventDefault();
    setProposalError(null);
    if (!proposalFile) {
      setProposalError('Selecione uma foto como evidência.');
      return;
    }
    proposalMutation.mutate(proposalFile);
  }

  return (
    <div>
      <p>
        <Link to="/">Voltar</Link>
      </p>
      <h1>{problem.title}</h1>
      <p>Status: {STATUS_LABELS[problem.status]}</p>
      <p>{problem.description}</p>
      <p>Local: {problem.location}</p>
      <p>{problem.voteCount} voto(s)</p>

      <ul>
        {problem.media.map((m) => (
          <li key={m.id}>
            {m.mediaType === 'image' ? <img src={m.url} alt={problem.title} /> : <video src={m.url} controls />}
          </li>
        ))}
      </ul>

      {canVote && (
        <button onClick={() => voteMutation.mutate()} disabled={voteMutation.isPending}>
          {problem.hasVoted ? 'Remover voto' : 'Votar'}
        </button>
      )}

      {canCancel && (
        <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
          Cancelar
        </button>
      )}

      {canResolve && (
        <button onClick={() => resolveMutation.mutate()} disabled={resolveMutation.isPending}>
          Marcar como resolvido
        </button>
      )}

      {canPropose && (
        <form onSubmit={handleProposalSubmit}>
          <h2>Propor resolução</h2>
          <label htmlFor="proposalFile">Foto de evidência</label>
          <input
            id="proposalFile"
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setProposalFile(e.target.files?.[0] ?? null)}
          />
          {proposalError && <p role="alert">{proposalError}</p>}
          <button type="submit" disabled={proposalMutation.isPending}>
            Enviar proposta
          </button>
        </form>
      )}

      {canRate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ratingMutation.mutate();
          }}
        >
          <h2>Avaliar resolução</h2>
          <label htmlFor="score">Nota</label>
          <select id="score" value={score} onChange={(e) => setScore(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <label htmlFor="comment">Comentário (opcional)</label>
          <textarea id="comment" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />

          <button type="submit" disabled={ratingMutation.isPending}>
            Enviar avaliação
          </button>
        </form>
      )}

      {problem.status === 'resolved' && problem.rating && (
        <div>
          <h2>Avaliação</h2>
          <p>Nota: {problem.rating.score}/5</p>
          {problem.rating.comment && <p>{problem.rating.comment}</p>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add the /problems/:id route**

`apps/web/src/App.tsx` (replace):
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import { ProtectedRoute } from './auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/problems/:id" element={<ProblemDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: PASS

- [ ] **Step 6: Run typecheck**

Run: `pnpm --filter @reporte-aqui/web typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "feat(web): add problem detail page with conditional actions"
```

---

### Task 9: New problem page

**Files:**
- Create: `apps/web/src/pages/NewProblemPage.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/pages/NewProblemPage.test.tsx`

**Interfaces:**
- Consumes: `createProblem` from `../api/problems` (Task 6); `uploadMedia` from `../api/media` (Task 6); `ProtectedRoute` from `../auth/ProtectedRoute` (Task 5).
- Produces: `NewProblemPage` (default export, `./NewProblemPage`), mounted at `/problems/new`, protected.

- [ ] **Step 1: Write the failing test**

`apps/web/src/pages/NewProblemPage.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { mockLoggedIn } from '../test/authMocks';
import { renderWithProviders } from '../test/renderWithProviders';
import NewProblemPage from './NewProblemPage';

describe('NewProblemPage', () => {
  it('uploads media then creates the problem', async () => {
    mockLoggedIn({ id: 'u1', email: 'a@b.com', role: 'individual' });
    let createCalled = false;
    server.use(
      http.post('/api/media/upload-url', () =>
        HttpResponse.json({ objectKey: 'u1/a.jpg', uploadUrl: 'https://r2.example.com/u1/a.jpg' }),
      ),
      http.put('https://r2.example.com/u1/a.jpg', () => new HttpResponse(null, { status: 200 })),
      http.post('/api/problems', async ({ request }) => {
        const body = await request.json();
        expect(body.media).toEqual([{ objectKey: 'u1/a.jpg', mediaType: 'image' }]);
        createCalled = true;
        return HttpResponse.json({ id: 'new-id', ...body, status: 'open' }, { status: 201 });
      }),
    );

    renderWithProviders(<NewProblemPage />, { route: '/problems/new' });

    await userEvent.type(screen.getByLabelText('Título'), 'Buraco na rua principal');
    await userEvent.type(screen.getByLabelText('Descrição'), 'd'.repeat(20));
    await userEvent.type(screen.getByLabelText('Localização'), 'Rua X, 100');
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    await userEvent.upload(screen.getByLabelText('Fotos/vídeos (1 a 5 arquivos)'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(createCalled).toBe(true));
  });

  it('shows an error when no media is selected', async () => {
    mockLoggedIn({ id: 'u1', email: 'a@b.com', role: 'individual' });

    renderWithProviders(<NewProblemPage />, { route: '/problems/new' });

    await userEvent.type(screen.getByLabelText('Título'), 'Buraco na rua principal');
    await userEvent.type(screen.getByLabelText('Descrição'), 'd'.repeat(20));
    await userEvent.type(screen.getByLabelText('Localização'), 'Rua X, 100');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Adicione ao menos uma foto ou vídeo.');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: FAIL — `./NewProblemPage` cannot be resolved.

- [ ] **Step 3: Implement NewProblemPage**

`apps/web/src/pages/NewProblemPage.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createProblem } from '../api/problems';
import { uploadMedia } from '../api/media';

export default function NewProblemPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const media = await Promise.all(files.map((file) => uploadMedia(file)));
      return createProblem({ title, description, location, media });
    },
    onSuccess: (problem) => navigate(`/problems/${problem.id}`),
    onError: () => setError('Não foi possível criar o problema. Tente novamente.'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (files.length === 0) {
      setError('Adicione ao menos uma foto ou vídeo.');
      return;
    }
    if (files.length > 5) {
      setError('No máximo 5 arquivos de mídia.');
      return;
    }
    mutation.mutate();
  }

  return (
    <div>
      <h1>Reportar problema</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Título</label>
        <input
          id="title"
          required
          minLength={5}
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label htmlFor="description">Descrição</label>
        <textarea
          id="description"
          required
          minLength={20}
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label htmlFor="location">Localização</label>
        <input
          id="location"
          required
          minLength={5}
          maxLength={300}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <label htmlFor="media">Fotos/vídeos (1 a 5 arquivos)</label>
        <input
          id="media"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={mutation.isPending}>
          Enviar
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Add the protected /problems/new route**

`apps/web/src/App.tsx` (replace):
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import NewProblemPage from './pages/NewProblemPage';
import { ProtectedRoute } from './auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/problems/new"
          element={
            <ProtectedRoute>
              <NewProblemPage />
            </ProtectedRoute>
          }
        />
        <Route path="/problems/:id" element={<ProblemDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @reporte-aqui/web test`
Expected: PASS — full suite green.

- [ ] **Step 6: Run typecheck**

Run: `pnpm --filter @reporte-aqui/web typecheck`
Expected: no errors

- [ ] **Step 7: Manual smoke check**

Run: `pnpm --filter @reporte-aqui/api dev` (in one terminal) and `pnpm --filter @reporte-aqui/web dev` (in another). Open the printed Vite URL, register an account, create a problem with a photo, and confirm it appears on the feed and its detail page.

- [ ] **Step 8: Commit**

```bash
git add apps/web
git commit -m "feat(web): add create problem page with media upload"
```
