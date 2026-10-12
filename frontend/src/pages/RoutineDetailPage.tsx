import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { routinesService } from '../services/endpoints';
import { Routine, RoutineProduct } from '../types';
import { Spinner, ErrorBanner, EmptyState, PageHeader } from '../components/UI';

export default function RoutineDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data, loading, error, reload } = useApi<{ routine: Routine; products: RoutineProduct[] }>(
        () => routinesService.get(id!),
        [id]
    );

    if (loading) return <Spinner label="Loading routine..." />;
    if (error) return <ErrorBanner message={error} onRetry={reload} />;
    if (!data) return null;

    return (
        <>
            <PageHeader
                title={data.routine.name}
                subtitle={`${data.routine.routine_type}${data.routine.is_active ? '' : ' · Inactive'}`}
                actions={
                    <>
                        <Link className="btn" to="/routines">All routines</Link>
                        <Link className="btn btn--primary" to={`/routines/${data.routine.id}/edit`}>Edit</Link>
                    </>
                }
            />

            {data.routine.description && <p>{data.routine.description}</p>}

            <div className="card">
                <h3>Steps</h3>
                {data.products.length === 0 ? (
                    <EmptyState title="This routine has no products yet." />
                ) : (
                    <ol style={{ paddingLeft: '1.25rem' }}>
                        {data.products.map((p) => (
                            <li key={p.id} style={{ marginBottom: '0.5rem' }}>
                                <strong>{p.product_name}</strong> <span className="muted tiny">— {p.product_brand ?? 'no brand'} · {p.category_name}</span>
                                {p.frequency && <div className="muted tiny">Frequency: {p.frequency}</div>}
                                {p.notes && <div className="tiny">{p.notes}</div>}
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </>
    );
}