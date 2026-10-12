import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { routinesService } from '../services/endpoints';
import { Routine } from '../types';
import { Spinner, ErrorBanner, EmptyState, PageHeader } from '../components/UI';
import { useToast } from '../context/ToastContext';

export default function RoutinesPage() {
    const toast = useToast();
    const { data, loading, error, reload } = useApi<{ routines: Routine[] }>(() => routinesService.list(), []);
    const [busy, setBusy] = useState<string | null>(null);

    async function toggleActive(r: Routine) {
        setBusy(r.id);
        try {
            await routinesService.update(r.id, { is_active: !r.is_active });
            toast.push('Updated', 'success');
            await reload();
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setBusy(null);
        }
    }

    async function remove(r: Routine) {
        if (!confirm(`Delete routine "${r.name}"?`)) return;
        setBusy(r.id);
        try {
            await routinesService.delete(r.id);
            toast.push('Routine deleted', 'success');
            await reload();
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setBusy(null);
        }
    }

    return (
        <>
            <PageHeader title="My Routines" actions={<Link className="btn btn--primary" to="/routines/new">New routine</Link>} />

            {loading && <Spinner label="Loading routines..." />}
            {error && <ErrorBanner message={error} onRetry={reload} />}

            {!loading && !error && (data?.routines.length ?? 0) === 0 && (
                <EmptyState
                    title="No routines yet."
                    action={<Link className="btn btn--primary" to="/routines/new">Create your first routine</Link>}
                />
            )}

            <div className="card-grid">
                {(data?.routines ?? []).map((r) => (
                    <div key={r.id} className="card">
                        <div className="row space-between">
                            <strong>{r.name}</strong>
                            <span className={`tag ${r.is_active ? 'tag--success' : 'tag--muted'}`}>{r.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <p className="muted tiny">{r.routine_type}</p>
                        {r.description && <p className="tiny">{r.description}</p>}
                        <div className="row" style={{ marginTop: '0.5rem' }}>
                            <Link className="btn btn--small" to={`/routines/${r.id}`}>Open</Link>
                            <button className="btn btn--ghost btn--small" disabled={busy === r.id} onClick={() => toggleActive(r)}>{r.is_active ? 'Pause' : 'Activate'}</button>
                            <button className="btn btn--danger btn--small" disabled={busy === r.id} onClick={() => remove(r)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}