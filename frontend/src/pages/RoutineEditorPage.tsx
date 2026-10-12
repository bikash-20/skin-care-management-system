import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { productsService, routinesService } from '../services/endpoints';
import { Product, Routine, RoutineProduct } from '../types';
import { Spinner, ErrorBanner, PageHeader } from '../components/UI';
import { useToast } from '../context/ToastContext';

const TYPES = [
    { value: 'MORNING', label: 'Morning' },
    { value: 'NIGHT', label: 'Night' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'CUSTOM', label: 'Custom' },
];

interface DraftStep {
    id?: string;
    product_id: string;
    step_order: number;
    frequency?: string | null;
}

export default function RoutineEditorPage() {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const isEdit = !!id;

    const [name, setName] = useState('');
    const [routineType, setRoutineType] = useState('MORNING');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [steps, setSteps] = useState<DraftStep[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const { data: productsData, loading: loadingProducts } = useApi<{ products: Product[] }>(() => productsService.list({}), []);
    const { data: existing, loading: loadingExisting } = useApi<{ routine: Routine; products: RoutineProduct[] }>(
        () => routinesService.get(id!),
        [id]
    );

    useEffect(() => {
        if (isEdit && existing) {
            setName(existing.routine.name);
            setRoutineType(existing.routine.routine_type);
            setDescription(existing.routine.description ?? '');
            setIsActive(existing.routine.is_active);
            setSteps(existing.products.map((p) => ({
                id: p.id,
                product_id: p.product_id,
                step_order: p.step_order,
                frequency: p.frequency,
            })));
        }
    }, [isEdit, existing]);

    const products = productsData?.products ?? [];

    function addStep() {
        const next = steps.length === 0 ? 1 : Math.max(...steps.map((s) => s.step_order)) + 1;
        setSteps([...steps, { product_id: '', step_order: next, frequency: 'Daily' }]);
    }

    function updateStep(index: number, patch: Partial<DraftStep>) {
        setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
    }

    function removeStep(index: number) {
        setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 })));
    }

    function moveStep(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= steps.length) return;
        setSteps((prev) => {
            const copy = [...prev];
            [copy[index], copy[target]] = [copy[target], copy[index]];
            return copy.map((s, i) => ({ ...s, step_order: i + 1 }));
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) { toast.push('Name is required', 'error'); return; }
        if (steps.some((s) => !s.product_id)) { toast.push('Please pick a product for every step', 'error'); return; }
        setSubmitting(true);
        try {
            const payload = {
                name,
                routine_type: routineType as Routine['routine_type'],
                description: description || null,
                is_active: isActive,
                products: steps.map((s) => ({ product_id: s.product_id, step_order: s.step_order, frequency: s.frequency ?? null })),
            };
            if (isEdit) {
                await routinesService.update(id!, payload);
                toast.push('Routine updated', 'success');
            } else {
                const created = await routinesService.create(payload);
                toast.push('Routine created', 'success');
                navigate(`/routines/${created.routine.id}`, { replace: true });
                return;
            }
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    if ((isEdit && loadingExisting) || loadingProducts) return <Spinner label="Loading..." />;

    return (
        <>
            <PageHeader title={isEdit ? 'Edit routine' : 'New routine'} />
            {isEdit && !existing && <ErrorBanner message="Routine not found" />}

            <form className="card" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-row">
                        <label htmlFor="rname">Name</label>
                        <input id="rname" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-row">
                        <label htmlFor="rtype">Type</label>
                        <select id="rtype" className="select" value={routineType} onChange={(e) => setRoutineType(e.target.value)}>
                            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="form-row">
                        <label htmlFor="ractive">Status</label>
                        <select id="ractive" className="select" value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')}>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <label htmlFor="rdesc">Description</label>
                    <textarea id="rdesc" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <h3 style={{ marginTop: '1rem' }}>Steps</h3>
                <p className="muted tiny">Order matters. Move steps up or down to change the order.</p>

                {steps.length === 0 && <p className="muted">No steps yet.</p>}

                <div className="stack">
                    {steps.map((step, idx) => (
                        <div key={idx} className="card" style={{ background: 'var(--color-bg-alt)' }}>
                            <div className="row" style={{ alignItems: 'flex-end' }}>
                                <div style={{ minWidth: 50, textAlign: 'center' }}>
                                    <div className="tag" style={{ fontSize: '1rem' }}>{step.step_order}</div>
                                </div>
                                <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
                                    <label htmlFor={`prod_${idx}`}>Product</label>
                                    <select id={`prod_${idx}`} className="select" value={step.product_id} onChange={(e) => updateStep(idx, { product_id: e.target.value })}>
                                        <option value="">Select a product</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name} — {p.brand ?? 'no brand'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row" style={{ width: 140, marginBottom: 0 }}>
                                    <label htmlFor={`freq_${idx}`}>Frequency</label>
                                    <input id={`freq_${idx}`} className="input" value={step.frequency ?? ''} onChange={(e) => updateStep(idx, { frequency: e.target.value })} />
                                </div>
                                <div className="row">
                                    <button type="button" className="btn btn--ghost btn--small" onClick={() => moveStep(idx, -1)} aria-label="Move up">↑</button>
                                    <button type="button" className="btn btn--ghost btn--small" onClick={() => moveStep(idx, 1)} aria-label="Move down">↓</button>
                                    <button type="button" className="btn btn--danger btn--small" onClick={() => removeStep(idx)}>Remove</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button type="button" className="btn" onClick={addStep} style={{ marginTop: '0.5rem' }}>+ Add step</button>

                <div className="row" style={{ marginTop: '1rem' }}>
                    <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Saving...' : (isEdit ? 'Save changes' : 'Create routine')}</button>
                    <button type="button" className="btn btn--ghost" onClick={() => navigate('/routines')}>Cancel</button>
                </div>
            </form>
        </>
    );
}

void useMemo;