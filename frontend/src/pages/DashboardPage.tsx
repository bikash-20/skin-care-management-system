import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { dashboardService } from '../services/endpoints';
import { Spinner, EmptyState, ErrorBanner, PageHeader, MedicalBanner } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import LineChart from '../components/LineChart';

interface DashboardData {
    summary?: {
        skin_type?: string | null;
        active_routines_count?: string;
        active_products_count?: string;
        upcoming_appointments_count?: string;
        progress_records_count?: string;
    } | null;
    profile_completion?: { has_skin_type: boolean; has_notes: boolean };
    active_routine?: { id: string; name: string; routine_type: string } | null;
    active_routine_products?: Array<{ step_order: number; product_name: string; brand?: string | null }>;
    latest_progress?: {
        recorded_date: string; overall_condition_score: number | null; acne_severity: number | null;
        dryness_level: number | null; oiliness_level: number | null; redness_level: number | null;
    } | null;
    upcoming_appointments?: Array<{ id: string; appointment_date: string; appointment_time: string; reason: string; status: string }>;
    progress_history?: Array<{
        recorded_date: string; acne_severity: number | null; overall_condition_score: number | null;
    }>;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { data, loading, error, reload } = useApi<DashboardData>(() => dashboardService.get() as Promise<DashboardData>, []);

    if (loading) return <Spinner label="Loading your dashboard..." />;
    if (error) return <ErrorBanner message={error} onRetry={reload} />;
    if (!data) return null;

    const chartData = (data.progress_history ?? []).map((p) => ({ x: p.recorded_date, y: p.overall_condition_score }));
    const completion = data.profile_completion ?? { has_skin_type: false, has_notes: false };

    return (
        <>
            <PageHeader title={`Welcome, ${user?.full_name?.split(' ')[0] ?? 'friend'}!`} subtitle="Your skin-care snapshot at a glance." />

            <MedicalBanner />

            <div className="card-grid">
                <div className="card">
                    <h3>Skin Profile</h3>
                    <p className="muted">
                        {completion.has_skin_type
                            ? `Skin type: ${data.summary?.skin_type ?? 'set'}`
                            : 'No skin type set yet'}
                    </p>
                    <Link className="btn btn--small" to="/profile">Open profile</Link>
                </div>
                <div className="card">
                    <h3>Active Routine</h3>
                    {data.active_routine ? (
                        <>
                            <p><strong>{data.active_routine.name}</strong></p>
                            <p className="muted">{data.active_routine.routine_type}</p>
                            <Link className="btn btn--small" to={`/routines/${data.active_routine.id}`}>View routine</Link>
                        </>
                    ) : (
                        <EmptyState title="No active routine" action={<Link className="btn btn--primary btn--small" to="/routines/new">Create one</Link>} />
                    )}
                </div>
                <div className="card">
                    <h3>Active Products</h3>
                    <p style={{ fontSize: '1.6rem', margin: 0 }}>{data.summary?.active_products_count ?? '0'}</p>
                    <p className="muted">in your cabinet</p>
                    <Link className="btn btn--small" to="/my-products">Open cabinet</Link>
                </div>
                <div className="card">
                    <h3>Upcoming Appointment</h3>
                    {data.upcoming_appointments && data.upcoming_appointments.length > 0 ? (
                        <p>{data.upcoming_appointments[0].appointment_date} at {data.upcoming_appointments[0].appointment_time.slice(0, 5)}</p>
                    ) : (
                        <p className="muted">No upcoming appointments</p>
                    )}
                    <Link className="btn btn--small" to="/appointments">Manage</Link>
                </div>
                <div className="card">
                    <h3>Latest Progress</h3>
                    {data.latest_progress ? (
                        <p>
                            {data.latest_progress.recorded_date}: overall{' '}
                            <span className="tag">{data.latest_progress.overall_condition_score ?? '-'}</span>
                        </p>
                    ) : (
                        <p className="muted">No progress recorded yet</p>
                    )}
                    <Link className="btn btn--small" to="/progress">View history</Link>
                </div>
            </div>

            <div className="card" style={{ marginTop: '1rem' }}>
                <h3>Overall skin condition over time</h3>
                <p className="muted tiny">This chart shows your self-reported overall condition score (1-5). It is informational and not a medical measurement.</p>
                {chartData.length > 0 ? (
                    <LineChart points={chartData} label="Overall skin condition" />
                ) : (
                    <EmptyState title="Add a progress record to see your chart" />
                )}
            </div>
        </>
    );
}