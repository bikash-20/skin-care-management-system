import { FormEvent, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { progressService } from '../services/endpoints';
import { ProgressRecord } from '../types';
import { Spinner, ErrorBanner, EmptyState, PageHeader } from '../components/UI';
import { useToast } from '../context/ToastContext';
import LineChart from '../components/LineChart';

function todayIso(): string {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

const FIELDS: Array<{ key: keyof ProgressRecord; label: string }> = [
    { key: 'acne_severity', label: 'Acne severity' },
    { key: 'dryness_level', label: 'Dryness level' },
    { key: 'oiliness_level', label: 'Oiliness level' },
    { key: 'redness_level', label: 'Redness level' },
    { key: 'overall_condition_score', label: 'Overall condition' },
];

interface FormState {
    recorded_date: string;
    values: Record<string, number | ''>;
    notes: string;
    image_url: string;
}

function emptyForm(): FormState {
    return {
        recorded_date: todayIso(),
        values: {},
        notes: '',
        image_url: '',
    };
}

export default function ProgressPage() {
    const toast = useToast();
    const { data, loading, error, reload } = useApi<{ records: ProgressRecord[] }>(() => progressService.list(), []);
    const [form, setForm] = useState<FormState>(emptyForm());
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    function setValue(key: string, value: string) {
        setForm((prev) => ({ ...prev, values: { ...prev.values, [key]: value === '' ? '' : Number(value) } }));
    }

    function startEdit(record: ProgressRecord) {
        setEditingId(record.id);
        setForm({
            recorded_date: record.recorded_date,
            values: {
                acne_severity: record.acne_severity ?? '',
                dryness_level: record.dryness_level ?? '',
                oiliness_level: record.oiliness_level ?? '',
                redness_level: record.redness_level ?? '',
                overall_condition_score: record.overall_condition_score ?? '',
            },
            notes: record.notes ?? '',
            image_url: record.image_url ?? '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function reset() {
        setEditingId(null);
        setForm(emptyForm());
    }

    async function submit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                recorded_date: form.recorded_date,
                acne_severity: form.values.acne_severity === '' ? null : Number(form.values.acne_severity),
                dryness_level: form.values.dryness_level === '' ? null : Number(form.values.dryness_level),
                oiliness_level: form.values.oiliness_level === '' ? null : Number(form.values.oiliness_level),
                redness_level: form.values.redness_level === '' ? null : Number(form.values.redness_level),
                overall_condition_score: form.values.overall_condition_score === '' ? null : Number(form.values.overall_condition_score),
                notes: form.notes || null,
                image_url: form.image_url || null,
            };
            if (editingId) {
                await progressService.update(editingId, payload);
                toast.push('Record updated', 'success');
            } else {
                await progressService.create(payload);
                toast.push('Record added', 'success');
            }
            reset();
            await reload();
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    async function remove(id: string) {
        if (!confirm('Delete this progress record?')) return;
        try {
            await progressService.delete(id);
            toast.push('Deleted', 'success');
            await reload();
        } catch (err) {
            toast.push((err as Error).message, 'error');
        }
    }

    const records = data?.records ?? [];
    const chartPoints = records.map((r) => ({ x: r.recorded_date, y: r.overall_condition_score }));

    return (
        <>
            <PageHeader title="Progress Tracking" subtitle="Record how your skin feels and looks over time." />

            <form className="card" onSubmit={submit}>
                <h3>{editingId ? 'Edit record' : 'New record'}</h3>
                <div className="form-grid">
                    <div className="form-row">
                        <label htmlFor="rdate">Date</label>
                        <input id="rdate" type="date" className="input" value={form.recorded_date} onChange={(e) => setForm({ ...form, recorded_date: e.target.value })} required />
                    </div>
                </div>
                <div className="form-grid">
                    {FIELDS.map((f) => (
                        <div className="form-row" key={f.key}>
                            <label htmlFor={f.key}>{f.label}</label>
                            <select id={f.key} className="select" value={form.values[f.key] ?? ''} onChange={(e) => setValue(f.key, e.target.value)}>
                                <option value="">Not recorded</option>
                                <option value="1">1 - Very low</option>
                                <option value="2">2 - Low</option>
                                <option value="3">3 - Moderate</option>
                                <option value="4">4 - High</option>
                                <option value="5">5 - Very high</option>
                            </select>
                        </div>
                    ))}
                </div>
                <div className="form-row">
                    <label htmlFor="img">Image URL (optional)</label>
                    <input id="img" className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="form-row">
                    <label htmlFor="rnotes">Notes</label>
                    <textarea id="rnotes" className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <div className="row">
                    <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Saving...' : (editingId ? 'Save changes' : 'Add record')}</button>
                    {editingId && <button type="button" className="btn btn--ghost" onClick={reset}>Cancel edit</button>}
                </div>
            </form>

            <div className="card">
                <h3>Trend chart</h3>
                <p className="muted tiny">Self-reported overall condition over time. This is informational, not a medical measurement.</p>
                {chartPoints.length > 0 ? <LineChart points={chartPoints} /> : <EmptyState title="No progress yet" />}
            </div>

            {loading && <Spinner label="Loading..." />}
            {error && <ErrorBanner message={error} onRetry={reload} />}

            <div className="card">
                <h3>History</h3>
                {records.length === 0 ? (
                    <EmptyState title="No records yet" />
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Overall</th>
                                <th>Acne</th>
                                <th>Dryness</th>
                                <th>Oiliness</th>
                                <th>Redness</th>
                                <th>Notes</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...records].reverse().map((r) => (
                                <tr key={r.id}>
                                    <td>{r.recorded_date}</td>
                                    <td>{r.overall_condition_score ?? '-'}</td>
                                    <td>{r.acne_severity ?? '-'}</td>
                                    <td>{r.dryness_level ?? '-'}</td>
                                    <td>{r.oiliness_level ?? '-'}</td>
                                    <td>{r.redness_level ?? '-'}</td>
                                    <td className="tiny">{r.notes ?? ''}</td>
                                    <td className="row">
                                        <button className="btn btn--small btn--ghost" onClick={() => startEdit(r)}>Edit</button>
                                        <button className="btn btn--small btn--danger" onClick={() => remove(r.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}