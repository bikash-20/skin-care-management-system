import { FormEvent, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { appointmentsService } from '../services/endpoints';
import { Appointment } from '../types';
import { Spinner, ErrorBanner, EmptyState, PageHeader } from '../components/UI';
import { useToast } from '../context/ToastContext';

const STATUSES = [
    { value: 'REQUESTED', label: 'Requested' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_TAG: Record<string, string> = {
    REQUESTED: 'tag--warning',
    CONFIRMED: 'tag--info',
    COMPLETED: 'tag--success',
    CANCELLED: 'tag--danger',
};

export default function AppointmentsPage() {
    const toast = useToast();
    const { data, loading, error, reload } = useApi<{ items: Appointment[] }>(() => appointmentsService.list(), []);
    const [filter, setFilter] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form
    const [form, setForm] = useState({
        appointment_date: '',
        appointment_time: '10:00',
        reason: '',
        notes: '',
    });

    async function submit(e: FormEvent) {
        e.preventDefault();
        if (!form.appointment_date || !form.reason.trim()) {
            toast.push('Please fill in date and reason', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await appointmentsService.create({
                appointment_date: form.appointment_date,
                appointment_time: form.appointment_time,
                reason: form.reason,
                notes: form.notes || undefined,
            });
            toast.push('Appointment requested', 'success');
            setForm({ appointment_date: '', appointment_time: '10:00', reason: '', notes: '' });
            await reload();
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    const items = (data?.items ?? []).filter((it) => !filter || it.status === filter);

    return (
        <>
            <PageHeader title="Appointments" subtitle="Request and manage your skin-care appointments." />

            <form className="card" onSubmit={submit}>
                <h3>Request a new appointment</h3>
                <div className="form-grid">
                    <div className="form-row">
                        <label htmlFor="adate">Date</label>
                        <input id="adate" type="date" className="input" value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} required />
                    </div>
                    <div className="form-row">
                        <label htmlFor="atime">Time</label>
                        <input id="atime" type="time" className="input" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} required />
                    </div>
                </div>
                <div className="form-row">
                    <label htmlFor="areason">Reason</label>
                    <input id="areason" className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
                </div>
                <div className="form-row">
                    <label htmlFor="anotes">Notes (optional)</label>
                    <textarea id="anotes" className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <button className="btn btn--primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Request appointment'}</button>
            </form>

            <div className="toolbar">
                <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 220 }}>
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
            </div>

            {loading && <Spinner label="Loading appointments..." />}
            {error && <ErrorBanner message={error} onRetry={reload} />}

            {!loading && !error && items.length === 0 && <EmptyState title="No appointments yet" />}

            <div className="card-grid">
                {items.map((a) => (
                    <div key={a.id} className="card">
                        <div className="row space-between">
                            <strong>{a.appointment_date}</strong>
                            <span className={`tag ${STATUS_TAG[a.status] ?? ''}`}>{a.status}</span>
                        </div>
                        <p className="muted tiny">at {a.appointment_time.slice(0, 5)}</p>
                        <p>{a.reason}</p>
                        {a.notes && <p className="tiny">{a.notes}</p>}
                    </div>
                ))}
            </div>
        </>
    );
}