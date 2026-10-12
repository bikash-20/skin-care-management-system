import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

function NavItem({ to, children, end }: { to: string; children: ReactNode; end?: boolean }) {
    return (
        <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {children}
        </NavLink>
    );
}

export default function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    return (
        <div className="app-shell">
            <header className="topbar" role="banner">
                <div className="topbar__brand">
                    <span aria-hidden>🌿</span>
                    <span>SCMS</span>
                </div>
                <nav className="topbar__nav" aria-label="Primary">
                    <NavItem to="/dashboard">Dashboard</NavItem>
                    <NavItem to="/profile">Profile</NavItem>
                    <NavItem to="/products">Products</NavItem>
                    <NavItem to="/my-products">My Cabinet</NavItem>
                    <NavItem to="/routines">Routines</NavItem>
                    <NavItem to="/progress">Progress</NavItem>
                    <NavItem to="/appointments">Appointments</NavItem>
                    {user?.role === 'ADMIN' && <NavItem to="/admin">Admin</NavItem>}
                </nav>
                <div className="topbar__user">
                    <span aria-label="Current user">{user?.full_name}</span>
                    <button className="btn btn--ghost btn--small" onClick={handleLogout}>Log out</button>
                </div>
            </header>
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
}