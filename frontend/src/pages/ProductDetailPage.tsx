import { FormEvent, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { productsService, userProductsService } from '../services/endpoints';
import { Product } from '../types';
import { Spinner, ErrorBanner, PageHeader } from '../components/UI';
import { useToast } from '../context/ToastContext';

const STATUSES = [
    { value: 'CURRENT', label: 'Currently using' },
    { value: 'FINISHED', label: 'Finished' },
    { value: 'PAUSED', label: 'Paused' },
    { value: 'DISCONTINUED', label: 'Discontinued' },
];

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const toast = useToast();
    const navigate = useNavigate();
    const { data, loading, error, reload } = useApi<{ product: Product }>(() => productsService.get(id!), [id]);
    const [showForm, setShowForm] = useState(false);
    const [status, setStatus] = useState('CURRENT');
    const [frequency, setFrequency] = useState('Daily');
    const [rating, setRating] = useState<number | ''>('');
    const [personalNotes, setPersonalNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (loading) return <Spinner label="Loading product..." />;
    if (error) return <ErrorBanner message={error} onRetry={reload} />;
    if (!data) return null;
    const product = data.product;

    async function addToCabinet(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await userProductsService.create({
                product_id: product.id,
                status: status as 'CURRENT',
                frequency: frequency || null,
                rating: rating === '' ? null : Number(rating),
                personal_notes: personalNotes || null,
            });
            toast.push('Added to your cabinet', 'success');
            navigate('/my-products');
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <PageHeader title={product.name} subtitle={product.brand ?? ''} actions={<Link to="/products" className="btn btn--ghost">Back to catalog</Link>} />

            <div className="card">
                <div className="row space-between">
                    <span className="tag tag--muted">{product.category_name}</span>
                    {product.price && <span className="tag">${product.price}</span>}
                </div>
                {product.description && <p>{product.description}</p>}
                {product.key_ingredients && <p><strong>Key ingredients:</strong> {product.key_ingredients}</p>}
                {product.suitable_skin_types && <p><strong>Suitable for:</strong> {product.suitable_skin_types}</p>}
                {product.usage_instructions && <p><strong>How to use:</strong> {product.usage_instructions}</p>}

                {!showForm ? (
                    <button className="btn btn--primary" onClick={() => setShowForm(true)}>Add to my cabinet</button>
                ) : (
                    <form onSubmit={addToCabinet} className="card" style={{ marginTop: '1rem', background: 'var(--color-bg-alt)' }}>
                        <div className="form-grid">
                            <div className="form-row">
                                <label htmlFor="status">Status</label>
                                <select id="status" className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <label htmlFor="frequency">Frequency</label>
                                <input id="frequency" className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
                            </div>
                            <div className="form-row">
                                <label htmlFor="rating">Rating (1-5)</label>
                                <select id="rating" className="select" value={rating} onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))}>
                                    <option value="">No rating</option>
                                    <option value="1">1 - Poor</option>
                                    <option value="2">2</option>
                                    <option value="3">3 - OK</option>
                                    <option value="4">4</option>
                                    <option value="5">5 - Excellent</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <label htmlFor="personalNotes">Personal notes</label>
                            <textarea id="personalNotes" className="textarea" value={personalNotes} onChange={(e) => setPersonalNotes(e.target.value)} />
                        </div>
                        <div className="row">
                            <button className="btn btn--primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
                            <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
}