import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { userProductsService } from '../services/endpoints';
import { UserProduct } from '../types';
import { Spinner, ErrorBanner, EmptyState, PageHeader } from '../components/UI';
import { useToast } from '../context/ToastContext';

const STATUS_LABELS: Record<string, string> = {
    CURRENT: 'Currently using',
    FINISHED: 'Finished',
    PAUSED: 'Paused',
    DISCONTINUED: 'Discontinued',
};

const STATUS_TAG: Record<string, string> = {
    CURRENT: 'tag--success',
    FINISHED: 'tag--muted',
    PAUSED: 'tag--warning',
    DISCONTINUED: 'tag--danger',
};

export default function MyProductsPage() {
    const toast = useToast();
    const { data, loading, error, reload } = useApi<{ items: UserProduct[] }>(() => userProductsService.list(), []);
    const [filter, setFilter] = useState<string>('');
    const [busy, setBusy] = useState<string | null>(null);

    const filtered = (data?.items ?? []).filter((it) => !filter || it.status === filter);

    async function remove(id: string) {
        if (!confirm('Remove this product from your cabinet?')) return;
        setBusy(id);
        try {
            await userProductsService.delete(id);
            toast.push('Removed', 'success');
            await reload();
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setBusy(null);
        }
    }

    async function setStatus(id: string, status: UserProduct['status']) {
        setBusy(id);
        try {
            await userProductsService.update(id, { status });
            toast.push('Status updated', 'success');
            await reload();
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setBusy(null);
        }
    }

    return (
        <>
            <PageHeader title="My Cabinet" subtitle="The personal products you own or are trying out." />

            <div className="toolbar">
                <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 220 }}>
                    <option value="">All statuses</option>
                    <option value="CURRENT">Currently using</option>
                    <option value="FINISHED">Finished</option>
                    <option value="PAUSED">Paused</option>
                    <option value="DISCONTINUED">Discontinued</option>
                </select>
                <Link to="/products" className="btn btn--primary">Browse products</Link>
            </div>

            {loading && <Spinner label="Loading your cabinet..." />}
            {error && <ErrorBanner message={error} onRetry={reload} />}

            {!loading && !error && filtered.length === 0 && (
                <EmptyState
                    title="Your cabinet is empty."
                    action={<Link className="btn btn--primary" to="/products">Browse the catalog</Link>}
                />
            )}

            <div className="card-grid">
                {filtered.map((it) => (
                    <div key={it.id} className="card">
                        <div className="row space-between">
                            <strong>{it.product_name}</strong>
                            <span className={`tag ${STATUS_TAG[it.status] ?? ''}`}>{STATUS_LABELS[it.status]}</span>
                        </div>
                        <p className="muted tiny" style={{ margin: '0.25rem 0' }}>{it.product_brand ?? '—'} · {it.category_name}</p>
                        {it.frequency && <p className="tiny">Frequency: {it.frequency}</p>}
                        {it.rating != null && <p className="tiny">Rating: {it.rating}/5</p>}
                        {it.personal_notes && <p className="tiny">{it.personal_notes}</p>}
                        <div className="row" style={{ marginTop: '0.5rem' }}>
                            <select className="select" disabled={busy === it.id} value={it.status} onChange={(e) => setStatus(it.id, e.target.value as UserProduct['status'])} style={{ maxWidth: 180 }}>
                                <option value="CURRENT">Currently using</option>
                                <option value="FINISHED">Finished</option>
                                <option value="PAUSED">Paused</option>
                                <option value="DISCONTINUED">Discontinued</option>
                            </select>
                            <button className="btn btn--danger btn--small" disabled={busy === it.id} onClick={() => remove(it.id)}>Remove</button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}