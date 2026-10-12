import { ReactNode } from 'react';

export function Spinner({ label }: { label?: string }) {
    return (
        <div className="row" role="status" aria-live="polite">
            <span className="spinner" />
            {label && <span className="muted">{label}</span>}
        </div>
    );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
    return (
        <div className="empty-state">
            <p>{title}</p>
            {action}
        </div>
    );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="banner banner--error" role="alert">
            {message}
            {onRetry && (
                <button className="btn btn--ghost btn--small" onClick={onRetry} style={{ marginLeft: '0.5rem' }}>
                    Retry
                </button>
            )}
        </div>
    );
}

export function MedicalBanner() {
    return (
        <div className="medical-banner">
            <strong>Important:</strong> This application provides general skin-care tracking only. It does not diagnose conditions or replace a dermatologist. Please consult a qualified professional for any persistent concerns.
        </div>
    );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
    return (
        <div className="page-header">
            <div>
                <h1 style={{ marginBottom: 4 }}>{title}</h1>
                {subtitle && <p className="muted" style={{ margin: 0 }}>{subtitle}</p>}
            </div>
            {actions && <div className="row">{actions}</div>}
        </div>
    );
}

interface UseApiResult<T> { data?: T; loading: boolean; error: string | null; reload: () => void; }