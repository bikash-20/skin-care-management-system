import { useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { adminService, AdminStats, AdminUser, appointmentsService, categoriesService, productsService } from '../services/endpoints';
import { Appointment, Category, Product } from '../types';
import { Spinner, ErrorBanner, PageHeader, EmptyState } from '../components/UI';
import { useToast } from '../context/ToastContext';

function AdminOverview() {
    const { data, loading, error, reload } = useApi<AdminStats>(() => adminService.stats(), []);
    if (loading) return <Spinner label="Loading stats..." />;
    if (error) return <ErrorBanner message={error} onRetry={reload} />;
    if (!data) return null;
    const totals = data.totals;
    return (
        <>
            <PageHeader title="Admin overview" />
            <div className="card-grid">
                <StatCard label="Total users" value={totals.total_users} />
                <StatCard label="Active users" value={totals.active_users} />
                <StatCard label="Total products" value={totals.total_products} />
                <StatCard label="Active products" value={totals.active_products} />
                <StatCard label="Categories" value={totals.total_categories} />
                <StatCard label="Appointments" value={totals.total_appointments} />
                <StatCard label="Pending appointments" value={totals.pending_appointments} />
                <StatCard label="Progress records" value={totals.total_progress} />
            </div>

            <div className="card">
                <h3>Products per category</h3>
                <table className="table">
                    <thead><tr><th>Category</th><th>Products</th></tr></thead>
                    <tbody>
                        {data.products_per_category.map((row) => (
                            <tr key={row.category_name}>
                                <td>{row.category_name}</td>
                                <td>{row.product_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="card">
            <p className="muted" style={{ marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: '1.6rem', margin: 0, fontWeight: 700 }}>{value}</p>
        </div>
    );
}

function AdminUsers() {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const { data, loading, error, reload } = useApi<{ users: AdminUser[] }>(() => adminService.listUsers(search), [search]);
    const [busy, setBusy] = useState<string | null>(null);

    async function toggleActive(u: AdminUser) {
        setBusy(u.id);
        try {
            await adminService.setUserActive(u.id, !u.is_active);
            toast.push('User updated', 'success');
            await reload();
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setBusy(null);
        }
    }

    return (
        <>
            <PageHeader title="Manage users" />
            <div className="toolbar">
                <input className="input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
            </div>
            {loading && <Spinner label="Loading users..." />}
            {error && <ErrorBanner message={error} onRetry={reload} />}
            {data && data.users.length === 0 && <EmptyState title="No users match" />}
            {data && data.users.length > 0 && (
                <table className="table">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th></th></tr></thead>
                    <tbody>
                        {data.users.map((u) => (
                            <tr key={u.id}>
                                <td>{u.full_name}</td>
                                <td>{u.email}</td>
                                <td><span className="tag">{u.role}</span></td>
                                <td><span className={`tag ${u.is_active ? 'tag--success' : 'tag--muted'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td className="tiny">{u.created_at.slice(0, 10)}</td>
                                <td><button className="btn btn--small" disabled={busy === u.id} onClick={() => toggleActive(u)}>{u.is_active ? 'Deactivate' : 'Activate'}</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}

function AdminProducts() {
    const toast = useToast();
    const { data, loading, error, reload } = useApi<{ products: Product[] }>(() => productsService.list({}), []);
    const [busy, setBusy] = useState<string | null>(null);

    async function setActive(p: Product, isActive: boolean) {
        setBusy(p.id);
        try {
            await productsService.setActive(p.id, isActive);
            toast.push(`Product ${isActive ? 'activated' : 'deactivated'}`, 'success');
            await reload();
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setBusy(null);
        }
    }

    return (
        <>
            <PageHeader title="Manage products" />
            {loading && <Spinner label="Loading products..." />}
            {error && <ErrorBanner message={error} onRetry={reload} />}
            {data && data.products.length === 0 && <EmptyState title="No products yet" />}
            {data && (
                <table className="table">
                    <thead><tr><th>Name</th><th>Brand</th><th>Category</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                        {data.products.map((p) => (
                            <tr key={p.id}>
                                <td><Link to={`/products/${p.id}`}>{p.name}</Link></td>
                                <td>{p.brand ?? '—'}</td>
                                <td>{p.category_name}</td>
                                <td><span className={`tag ${p.is_active ? 'tag--success' : 'tag--muted'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td>
                                    <button className="btn btn--small" disabled={busy === p.id} onClick={() => setActive(p, !p.is_active)}>
                                        {p.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}

function AdminCategories() {
    const toast = useToast();
    const { data, loading, error, reload } = useApi<{ categories: Category[] }>(() => categoriesService.list(), []);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [busy, setBusy] = useState<string | null>(null);

    async function create(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            await categoriesService.create({ name: newName.trim(), description: newDesc.trim() || undefined });
            setNewName('');
            setNewDesc('');
            toast.push('Category created', 'success');
            await reload();
        } catch (err) {
            toast.push((err as Error).message, 'error');
        }
    }

    async function setActive(c: Category, isActive: boolean) {
        setBusy(c.id);
        try {
            await categoriesService.setActive(c.id, isActive);
            toast.push(`Category ${isActive ? 'activated' : 'deactivated'}`, 'success');
            await reload();
        } catch (err) {
            toast.push((err as Error).message, 'error');
        } finally {
            setBusy(null);
        }
    }

    return (
        <>
            <PageHeader title="Manage categories" />
            <form className="card" onSubmit={create}>
                <h3>New category</h3>
                <div className="form-grid">
                    <div className="form-row">
                        <label htmlFor="cname">Name</label>
                        <input id="cname" className="input" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                    </div>
                    <div className="form-row">
                        <label htmlFor="cdesc">Description</label>
                        <input id="cdesc" className="input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                    </div>
                </div>
                <button className="btn btn--primary" type="submit">Create</button>
            </form>

            {loading && <Spinner />}
            {error && <ErrorBanner message={error} onRetry={reload} />}

            {data && (
                <table className="table">
                    <thead><tr><th>Name</th><th>Description</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                        {data.categories.map((c) => (
                            <tr key={c.id}>
                                <td><strong>{c.name}</strong></td>
                                <td className="tiny">{c.description ?? ''}</td>
                                <td><span className={`tag ${c.is_active ? 'tag--success' : 'tag--muted'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td>
                                    <button className="btn btn--small" disabled={busy === c.id} onClick={() => setActive(c, !c.is_active)}>
                                        {c.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}

function AdminAppointments() {
    const toast = useToast();
    const [filter, setFilter] = useState('');
    const { data, loading, error, reload } = useApi<{ items: Appointment[] }>(() => appointmentsService.list({ status: filter || undefined }), [filter]);
    const [busy, setBusy] = useState<string | null>(null);

    async function setStatus(a: Appointment, status: Appointment['status']) {
        setBusy(a.id);
        try {
            await appointmentsService.setStatus(a.id, status);
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
            <PageHeader title="Manage appointments" />
            <div className="toolbar">
                <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 220 }}>
                    <option value="">All statuses</option>
                    <option value="REQUESTED">Requested</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {loading && <Spinner />}
            {error && <ErrorBanner message={error} onRetry={reload} />}

            {data && data.items.length === 0 && <EmptyState title="No appointments" />}

            {data && data.items.length > 0 && (
                <table className="table">
                    <thead><tr><th>Date</th><th>Time</th><th>User</th><th>Reason</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                        {data.items.map((a) => (
                            <tr key={a.id}>
                                <td>{a.appointment_date}</td>
                                <td>{a.appointment_time.slice(0, 5)}</td>
                                <td>{a.user_full_name}<br /><span className="tiny muted">{a.user_email}</span></td>
                                <td>{a.reason}</td>
                                <td><span className="tag">{a.status}</span></td>
                                <td>
                                    <select className="select" disabled={busy === a.id} value={a.status} onChange={(e) => setStatus(a, e.target.value as Appointment['status'])} style={{ maxWidth: 160 }}>
                                        <option value="REQUESTED">Requested</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}

function AdminAuditLogs() {
    const { data, loading, error, reload } = useApi<{ logs: import('../services/endpoints').AuditLog[] }>(() => adminService.listAuditLogs(), []);
    return (
        <>
            <PageHeader title="Audit logs" />
            {loading && <Spinner />}
            {error && <ErrorBanner message={error} onRetry={reload} />}
            {data && data.logs.length === 0 && <EmptyState title="No audit entries yet" />}
            {data && data.logs.length > 0 && (
                <table className="table">
                    <thead><tr><th>When</th><th>User ID</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
                    <tbody>
                        {data.logs.map((l) => (
                            <tr key={l.id}>
                                <td className="tiny">{l.created_at.replace('T', ' ').slice(0, 19)}</td>
                                <td className="tiny">{l.user_id ?? '-'}</td>
                                <td><span className="tag">{l.action}</span></td>
                                <td className="tiny">{l.entity_type ?? '-'}{l.entity_id ? ` #${l.entity_id}` : ''}</td>
                                <td className="tiny" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.details ? JSON.stringify(l.details) : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
}

export default function AdminPage() {
    return (
        <>
            <PageHeader title="Admin Console" subtitle="Manage users, products, categories, appointments and view system stats." />
            <nav className="toolbar" aria-label="Admin sections">
                <NavLink to="/admin" end className={({ isActive }) => `btn ${isActive ? 'btn--primary' : ''}`}>Overview</NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => `btn ${isActive ? 'btn--primary' : ''}`}>Users</NavLink>
                <NavLink to="/admin/products" className={({ isActive }) => `btn ${isActive ? 'btn--primary' : ''}`}>Products</NavLink>
                <NavLink to="/admin/categories" className={({ isActive }) => `btn ${isActive ? 'btn--primary' : ''}`}>Categories</NavLink>
                <NavLink to="/admin/appointments" className={({ isActive }) => `btn ${isActive ? 'btn--primary' : ''}`}>Appointments</NavLink>
                <NavLink to="/admin/audit" className={({ isActive }) => `btn ${isActive ? 'btn--primary' : ''}`}>Audit</NavLink>
            </nav>

            <Routes>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="appointments" element={<AdminAppointments />} />
                <Route path="audit" element={<AdminAuditLogs />} />
            </Routes>
        </>
    );
}