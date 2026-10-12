import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import MyProductsPage from './pages/MyProductsPage';
import RoutinesPage from './pages/RoutinesPage';
import RoutineEditorPage from './pages/RoutineEditorPage';
import RoutineDetailPage from './pages/RoutineDetailPage';
import ProgressPage from './pages/ProgressPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AdminPage from './pages/AdminPage';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/my-products" element={<MyProductsPage />} />
                <Route path="/routines" element={<RoutinesPage />} />
                <Route path="/routines/new" element={<RoutineEditorPage />} />
                <Route path="/routines/:id/edit" element={<RoutineEditorPage />} />
                <Route path="/routines/:id" element={<RoutineDetailPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />

                <Route path="/admin/*" element={
                    <ProtectedRoute roles={['ADMIN']}><AdminPage /></ProtectedRoute>
                } />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}