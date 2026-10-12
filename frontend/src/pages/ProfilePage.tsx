import { FormEvent, useEffect, useState } from 'react';
import { profileService } from '../services/endpoints';
import { SkinConcern, SkinProfile, UserSkinConcern } from '../types';
import { Spinner, ErrorBanner, PageHeader } from '../components/UI';
import { useToast } from '../context/ToastContext';

const SKIN_TYPES = [
    { value: 'DRY', label: 'Dry' },
    { value: 'OILY', label: 'Oily' },
    { value: 'COMBINATION', label: 'Combination' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'SENSITIVE', label: 'Sensitive' },
    { value: 'UNKNOWN', label: 'Unknown' },
];

export default function ProfilePage() {
    const toast = useToast();
    const [profile, setProfile] = useState<SkinProfile | null>(null);
    const [allConcerns, setAllConcerns] = useState<SkinConcern[]>([]);
    const [userConcerns, setUserConcerns] = useState<UserSkinConcern[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [skinType, setSkinType] = useState<string>('UNKNOWN');
    const [notes, setNotes] = useState<string>('');
    const [selected, setSelected] = useState<Record<string, { severity: number | null; notes: string }>>({});

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [p, c, uc] = await Promise.all([
                    profileService.get(),
                    profileService.listConcerns(),
                    profileService.getUserConcerns(),
                ]);
                if (!mounted) return;
                setProfile(p.profile);
                setAllConcerns(c.concerns);
                setUserConcerns(uc.concerns);
                setSkinType(p.profile?.skin_type ?? 'UNKNOWN');
                setNotes(p.profile?.notes ?? '');
                const map: typeof selected = {};
                for (const c of uc.concerns) {
                    map[c.concern_id] = { severity: c.severity, notes: c.notes ?? '' };
                }
                setSelected(map);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    function toggleConcern(concernId: string) {
        setSelected((prev) => {
            const copy = { ...prev };
            if (copy[concernId]) {
                delete copy[concernId];
            } else {
                copy[concernId] = { severity: null, notes: '' };
            }
            return copy;
        });
    }

    function setConcernSeverity(concernId: string, severity: number | null) {
        setSelected((prev) => ({
            ...prev,
            [concernId]: { ...(prev[concernId] ?? { severity: null, notes: '' }), severity },
        }));
    }

    async function saveProfile(e: FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const result = await profileService.upsert({
                skin_type: skinType as SkinProfile['skin_type'],
                notes: notes || null,
            });
            setProfile(result.profile);
            toast.push('Profile saved', 'success');
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setSaving(false);
        }
    }

    async function saveConcerns() {
        setSaving(true);
        try {
            const payload = Object.entries(selected).map(([concern_id, v]) => ({
                concern_id,
                severity: v.severity,
                notes: v.notes || null,
            }));
            const result = await profileService.setUserConcerns(payload);
            setUserConcerns(result.concerns);
            toast.push('Concerns updated', 'success');
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <Spinner label="Loading profile..." />;
    if (error) return <ErrorBanner message={error} />;

    return (
        <>
            <PageHeader title="My Skin Profile" subtitle="Capture your skin type, notes, and concerns." />

            <form className="card" onSubmit={saveProfile}>
                <h3>Skin basics</h3>
                <div className="form-grid">
                    <div className="form-row">
                        <label htmlFor="skin_type">Skin type</label>
                        <select id="skin_type" className="select" value={skinType} onChange={(e) => setSkinType(e.target.value)}>
                            {SKIN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <label htmlFor="notes">Notes / sensitivities</label>
                    <textarea id="notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything you want to remember about your skin (allergies, reactions, preferences...)" />
                </div>
                <button className="btn btn--primary" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
            </form>

            <div className="card">
                <h3>Skin concerns</h3>
                <p className="muted">Tick the concerns that apply. You can record severity (1-5).</p>
                <div className="stack">
                    {allConcerns.map((c) => {
                        const sel = !!selected[c.id];
                        return (
                            <div key={c.id} className="row" style={{ alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: '1px dashed var(--color-border)' }}>
                                <label className="row" style={{ flex: 1, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={sel} onChange={() => toggleConcern(c.id)} />
                                    <span><strong>{c.name}</strong>{c.description ? <span className="muted tiny"> — {c.description}</span> : null}</span>
                                </label>
                                {sel && (
                                    <select
                                        className="select"
                                        style={{ maxWidth: 180 }}
                                        value={selected[c.id]?.severity ?? ''}
                                        onChange={(e) => setConcernSeverity(c.id, e.target.value === '' ? null : Number(e.target.value))}
                                    >
                                        <option value="">Severity...</option>
                                        <option value="1">1 - Very low</option>
                                        <option value="2">2 - Low</option>
                                        <option value="3">3 - Moderate</option>
                                        <option value="4">4 - High</option>
                                        <option value="5">5 - Very high</option>
                                    </select>
                                )}
                            </div>
                        );
                    })}
                </div>
                <button className="btn btn--primary" onClick={saveConcerns} disabled={saving} style={{ marginTop: '0.75rem' }}>Save concerns</button>
            </div>
        </>
    );
}