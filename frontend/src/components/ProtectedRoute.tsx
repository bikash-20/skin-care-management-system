import { Navigate, useLocation } from 'react-router-dom';
import { ReactElement } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface Props {
    children: ReactElement;
    roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: Props) {
    const { user, token, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="center" style={{ minHeight: '40vh' }}>
                <span className="spinner" aria-label="Loading" />
            </div>
        );
    }
    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
}