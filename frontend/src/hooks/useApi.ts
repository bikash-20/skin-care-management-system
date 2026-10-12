import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseApiResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

/**
 * Simple data-fetching hook. Calls `loader` once on mount and whenever
 * `deps` changes.
 */
export function useApi<T>(loader: () => Promise<T>, deps: unknown[] = []): UseApiResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await loader();
            if (isMounted.current) setData(result);
        } catch (err) {
            if (isMounted.current) setError((err as Error).message || 'Failed to load');
        } finally {
            if (isMounted.current) setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        isMounted.current = true;
        void reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return () => { isMounted.current = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, loading, error, reload };
}