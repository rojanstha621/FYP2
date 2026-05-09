import { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Card, Button } from '../components/FormElements';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await authAPI.getPatientDashboard();
      setDashboardData(res.data.result);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
      <div className="glass-panel rounded-[2rem] p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/50">Patient dashboard</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold text-palette-dark">
            Welcome, {dashboardData?.patient?.full_name || user?.first_name || 'Patient'}!
          </h1>
          <p className="mt-2 text-palette-dark/70">Track your recovery and therapist updates</p>
        </div>
        <div className="glass-panel-strong rounded-3xl px-4 py-3 text-sm text-palette-dark/70 max-w-sm">
          Your therapist overview, medical records, videos, and feedback are grouped below.
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <Card className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-palette-dark">My Therapist</h2>
          <span className="rounded-full bg-palette-blush/30 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-palette-dark/70">
            Care lead
          </span>
        </div>
        {dashboardData?.assigned_therapist ? (
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-palette-mauve to-[#6f4c60] text-white text-2xl font-bold shadow-lg">
                {dashboardData.assigned_therapist.first_name?.[0]}
                {dashboardData.assigned_therapist.last_name?.[0]}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-palette-dark">
                {dashboardData.assigned_therapist.first_name}{' '}
                {dashboardData.assigned_therapist.last_name}
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-palette-dark/70">
                  <span className="font-medium">Email:</span>{' '}
                  {dashboardData.assigned_therapist.email}
                </p>
                {dashboardData.assigned_therapist.phone_number && (
                  <p className="text-sm text-palette-dark/70">
                    <span className="font-medium">Phone:</span>{' '}
                    {dashboardData.assigned_therapist.phone_number}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-palette-dark/15 bg-white/60 px-6 py-10 text-center">
            <svg
              className="mx-auto h-12 w-12 text-palette-dark/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <p className="mt-2 text-palette-dark/60">No therapist assigned yet</p>
            <Link
              to="/therapists"
              className="mt-5 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-palette-mauve to-[#6f4c60] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Browse Therapists
            </Link>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link to="/medical-history" className="group">
          <Card className="h-full border-l-4 border-palette-blush transition-all group-hover:-translate-y-1 group-hover:shadow-2xl">
            <h3 className="text-lg font-bold text-palette-dark">Medical History</h3>
            <p className="mt-1 text-sm text-palette-dark/70">View or update your records</p>
            <p className="mt-5 text-sm font-semibold text-palette-mauve">Open record</p>
          </Card>
        </Link>

        <Link to="/patient/videos" className="group">
          <Card className="h-full border-l-4 border-palette-mauve transition-all group-hover:-translate-y-1 group-hover:shadow-2xl">
            <h3 className="text-lg font-bold text-palette-dark">My Videos</h3>
            <p className="mt-1 text-sm text-palette-dark/70">Watch therapist-assigned videos</p>
            <p className="mt-5 text-sm font-semibold text-palette-mauve">Open library</p>
          </Card>
        </Link>

        <Link to="/patient/feedback" className="group">
          <Card className="h-full border-l-4 border-palette-dark transition-all group-hover:-translate-y-1 group-hover:shadow-2xl">
            <h3 className="text-lg font-bold text-palette-dark">Feedback</h3>
            <p className="mt-1 text-sm text-palette-dark/70">See guidance from your therapist</p>
            <p className="mt-5 text-sm font-semibold text-palette-mauve">Read notes</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
