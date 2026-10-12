import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

interface Toast {
    id: string;
    message: string;
    kind: 'info' | 'success' | 'error';
}

interface ToastApi {
    push: (message: string, kind?: Toast['kind']) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const push = useCallback((message: string, kind: Toast['kind'] = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, kind }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);
    const api = useMemo(() => ({ push }), [push]);
    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="toast-stack" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast--${t.kind}`}>{t.message}</div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}