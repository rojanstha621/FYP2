import { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

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
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-palette-dark mb-2">
          Welcome, {dashboardData?.patient?.full_name || user?.first_name || 'Patient'}!
        </h1>
        <p className="text-palette-dark/70">Track your recovery and therapist updates</p>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <div className="bg-palette-cream rounded-lg shadow-md p-6 border-t-4 border-palette-blush mb-8">
        <h2 className="text-xl font-semibold text-palette-dark mb-4">My Therapist</h2>
        {dashboardData?.assigned_therapist ? (
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {dashboardData.assigned_therapist.first_name?.[0]}
                {dashboardData.assigned_therapist.last_name?.[0]}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-palette-dark">
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
          <div className="text-center py-8">
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
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-palette-mauve hover:bg-palette-dark"
            >
              Browse Therapists
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/medical-history"
          className="bg-palette-cream rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-palette-blush"
        >
          <h3 className="text-lg font-semibold text-palette-dark">Medical History</h3>
          <p className="text-sm text-palette-dark/70 mt-1">View or update your records</p>
        </Link>

        <Link
          to="/patient/videos"
          className="bg-palette-cream rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-palette-mauve"
        >
          <h3 className="text-lg font-semibold text-palette-dark">My Videos</h3>
          <p className="text-sm text-palette-dark/70 mt-1">Watch therapist-assigned videos</p>
        </Link>

        <Link
          to="/patient/feedback"
          className="bg-palette-cream rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-palette-dark"
        >
          <h3 className="text-lg font-semibold text-palette-dark">Feedback</h3>
          <p className="text-sm text-palette-dark/70 mt-1">See guidance from your therapist</p>
        </Link>
      </div>
    </div>
  );
}
