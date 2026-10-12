import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import { configureApi } from '../services/api';
import { User } from '../types';

const TOKEN_KEY = 'scms_token';

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (input: { full_name: string; email: string; password: string; phone?: string; date_of_birth?: string; gender?: string; }) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(!!token);

    // Wire the unauthorized handler once. The api.ts layer reads the token
    // directly from localStorage on every request, so there's no token
    // wiring needed here. We only need to know what to do if a protected
    // endpoint returns 401.
    useEffect(() => {
        configureApi({
            onUnauthorized: () => {
                setToken(null);
                setUser(null);
                localStorage.removeItem(TOKEN_KEY);
            },
        });
    }, []);

    // Initial-mount user hydration. Runs ONLY on first mount.
    useEffect(() => {
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }
        // We already have a user (set by login/register) — skip /me.
        if (user) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const data = await authService.me();
                if (!cancelled) setUser(data.user);
            } catch {
                if (!cancelled) {
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem(TOKEN_KEY);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const result = await authService.login({ email, password });
        // Write token to storage FIRST so any concurrent fetch started by
        // a freshly-mounted page picks up the new token immediately.
        localStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);
        setUser(result.user);
    }, []);

    const register = useCallback(async (input: Parameters<AuthState['register']>[0]) => {
        const result = await authService.register(input);
        localStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);
        setUser(result.user);
    }, []);

    const logout = useCallback(async () => {
        try { await authService.logout(); } catch { /* ignore */ }
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    }, []);

    const refresh = useCallback(async () => {
        if (!token) { setUser(null); setLoading(false); return; }
        try {
            const data = await authService.me();
            setUser(data.user);
        } catch {
            setUser(null);
            setToken(null);
            localStorage.removeItem(TOKEN_KEY);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const value = useMemo<AuthState>(() => ({
        user, token, loading, login, register, logout, refresh,
    }), [user, token, loading, login, register, logout, refresh]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}