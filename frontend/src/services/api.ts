import { ApiResponse } from '../types';

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

const TOKEN_STORAGE_KEY = 'scms_token';

/**
 * Always read the latest token directly from localStorage. This avoids the
 * stale-closure / useEffect-timing bug where the first request after a
 * fresh login was being sent without the Authorization header (because the
 * api.ts `tokenGetter` hadn't been re-wired yet). Reading localStorage
 * synchronously guarantees the token we just stored is the token we send.
 */
function getStoredToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
}

let onUnauthorized: () => void = () => {
    /* default: noop */
};

export function configureApi(opts: { getToken?: () => string | null; onUnauthorized?: () => void }) {
    // getToken is now ignored — we read from localStorage directly. The
    // parameter is kept for backwards compatibility with existing callers.
    void opts.getToken;
    if (opts.onUnauthorized) onUnauthorized = opts.onUnauthorized;
}

/**
 * Endpoints where a 401 means "session expired / unauthorized" and we should
 * wipe local auth state. Login/register 401s mean "wrong credentials" and
 * must NOT trigger the unauthorized handler, otherwise the next login
 * attempt would immediately wipe its own freshly-issued token.
 */
function shouldClearAuthOn401(method: string, path: string): boolean {
    const m = method.toUpperCase();
    const p = path.startsWith('/') ? path : `/${path}`;
    if (m === 'POST' && (p === '/auth/login' || p === '/auth/register')) return false;
    if (m === 'POST' && p === '/auth/logout') return false;
    return true;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers || {});
    if (!headers.has('Content-Type') && init.body) {
        headers.set('Content-Type', 'application/json');
    }
    const token = getStoredToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(`${BASE}${path}`, { ...init, headers });
    let body: ApiResponse<T> | null = null;
    try {
        body = (await res.json()) as ApiResponse<T>;
    } catch {
        /* not JSON */
    }
    if (!res.ok) {
        if (res.status === 401 && shouldClearAuthOn401(init.method ?? 'GET', path)) {
            onUnauthorized();
        }
        const message = (body && 'message' in body && body.message) || `Request failed (${res.status})`;
        const err = new Error(message);
        (err as Error & { status?: number }).status = res.status;
        throw err;
    }
    if (!body || body.success !== true) {
        const message = (body && 'message' in body && body.message) || 'Request failed';
        throw new Error(message);
    }
    // The backend returns { success, message, data }. Some endpoints may not have data.
    return (body as { data: T }).data as T;
}

export const api = {
    get: <T>(p: string) => request<T>(p, { method: 'GET' }),
    post: <T>(p: string, body?: unknown) =>
        request<T>(p, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
    put: <T>(p: string, body?: unknown) =>
        request<T>(p, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
    patch: <T>(p: string, body?: unknown) =>
        request<T>(p, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
    del: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};