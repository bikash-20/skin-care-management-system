import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        date_of_birth: '',
        gender: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function update<K extends keyof typeof form>(key: K, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function validate(): string | null {
        if (!form.full_name.trim()) return 'Full name is required';
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Please enter a valid email';
        if (form.password.length < 8) return 'Password must be at least 8 characters';
        return null;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const v = validate();
        if (v) { setError(v); return; }
        setError(null);
        setSubmitting(true);
        try {
            await register({
                full_name: form.full_name,
                email: form.email,
                password: form.password,
                phone: form.phone || undefined,
                date_of_birth: form.date_of_birth || undefined,
                gender: form.gender || undefined,
            });
            toast.push('Account created. Welcome!', 'success');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Create your account</h1>
                <p className="subtitle">Start tracking your skin-care routine in minutes.</p>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-row">
                        <label htmlFor="full_name">Full name</label>
                        <input id="full_name" className="input" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />
                    </div>
                    <div className="form-row">
                        <label htmlFor="reg_email">Email</label>
                        <input id="reg_email" className="input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required autoComplete="email" />
                    </div>
                    <div className="form-row">
                        <label htmlFor="reg_password">Password</label>
                        <input id="reg_password" className="input" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} autoComplete="new-password" />
                        <span className="tiny muted">Minimum 8 characters.</span>
                    </div>
                    <div className="form-grid">
                        <div className="form-row">
                            <label htmlFor="phone">Phone (optional)</label>
                            <input id="phone" className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                        </div>
                        <div className="form-row">
                            <label htmlFor="dob">Date of birth</label>
                            <input id="dob" className="input" type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} />
                        </div>
                        <div className="form-row">
                            <label htmlFor="gender">Gender (optional)</label>
                            <select id="gender" className="select" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                                <option value="">Prefer not to say</option>
                                <option value="FEMALE">Female</option>
                                <option value="MALE">Male</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>
                    {error && <div className="error-text" role="alert">{error}</div>}
                    <button className="btn btn--primary" type="submit" disabled={submitting} style={{ width: '100%', marginTop: '0.5rem' }}>
                        {submitting ? 'Creating account...' : 'Create account'}
                    </button>
                </form>
                <p className="muted" style={{ marginTop: '1rem' }}>
                    Already registered? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}