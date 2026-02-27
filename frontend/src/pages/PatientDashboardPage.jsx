import { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PENDING':
        return 'bg-palette-cream/60 text-palette-dark border-palette-mauve';
      case 'SKIPPED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-palette-cream/60 text-palette-dark border-palette-mauve';
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-palette-dark mb-2">
            Welcome, {dashboardData?.patient?.full_name || 'Patient'}!
          </h1>
          <p className="text-palette-dark/70">Track your exercises and progress</p>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Summary Card */}
          <div className="bg-palette-cream rounded-lg shadow-md p-6 border-t-4 border-palette-mauve">
            <h2 className="text-xl font-semibold text-palette-dark mb-4">Today's Progress</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-palette-dark/70">Total Assigned:</span>
                <span className="text-2xl font-bold text-palette-mauve">
                  {dashboardData?.today_summary?.total_exercises_assigned || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-palette-dark/70">Completed:</span>
                <span className="text-2xl font-bold text-green-600">
                  {dashboardData?.today_summary?.total_exercises_completed || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-palette-dark/70">Total Sets:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {dashboardData?.today_summary?.total_sets_completed || 0}
                </span>
              </div>
              {dashboardData?.today_summary?.total_exercises_assigned > 0 && (
                <div className="mt-4 pt-4 border-t border-palette-mauve/30">
                  <div className="w-full bg-palette-cream/60 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (dashboardData.today_summary.total_exercises_completed /
                            dashboardData.today_summary.total_exercises_assigned) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-palette-dark/60 mt-2 text-center">
                    {Math.round(
                      (dashboardData.today_summary.total_exercises_completed /
                        dashboardData.today_summary.total_exercises_assigned) *
                        100
                    )}
                    % Complete
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Therapist Card */}
          <div className="lg:col-span-2 bg-palette-cream rounded-lg shadow-md p-6 border-t-4 border-palette-blush">
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
        </div>

        {/* Today's Exercises Section */}
        <div className="bg-palette-cream rounded-lg shadow-md p-6 border-l-4 border-palette-mauve">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-palette-dark">Today's Exercises</h2>
            <Link
              to="/exercises"
              className="text-palette-mauve hover:text-palette-dark text-sm font-medium"
            >
              View All Exercises →
            </Link>
          </div>

          {dashboardData?.today_exercises && dashboardData.today_exercises.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.today_exercises.map((exercise) => (
                <div
                  key={exercise.plan_id}
                  className="border border-palette-mauve/30 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-palette-dark flex-1">
                      {exercise.exercise_name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        exercise.status
                      )}`}
                    >
                      {exercise.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-palette-dark/70">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium text-palette-dark">
                        {formatDuration(exercise.exercise_duration)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rest:</span>
                      <span className="font-medium text-palette-dark">
                        {formatDuration(exercise.rest_duration)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sets:</span>
                      <span className="font-medium text-palette-dark">{exercise.sets}</span>
                    </div>
                  </div>

                  {exercise.special_instructions && (
                    <div className="mt-3 pt-3 border-t border-palette-mauve/30">
                      <p className="text-xs text-palette-dark/60 italic">
                        <span className="font-medium">Note:</span> {exercise.special_instructions}
                      </p>
                    </div>
                  )}

                  {exercise.status === 'PENDING' && (
                    <button className="mt-4 w-full bg-palette-mauve hover:bg-palette-dark text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                      Start Exercise
                    </button>
                  )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="mt-2 text-palette-dark/60">No exercises assigned for today</p>
                <p className="text-sm text-palette-dark/50 mt-1">
                  Check back later or contact your therapist
                </p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/medical-history"
              className="bg-palette-cream rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-palette-blush"
            >
              <div className="flex items-center">
                <svg
                  className="h-8 w-8 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-palette-dark">Medical History</h3>
                  <p className="text-sm text-palette-dark/70">View/Update</p>
                </div>
              </div>
            </Link>

            <Link
              to="/profile"
              className="bg-palette-cream rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-palette-mauve"
            >
              <div className="flex items-center">
                <svg
                  className="h-8 w-8 text-pink-500"
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
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-palette-dark">My Profile</h3>
                  <p className="text-sm text-palette-dark/70">Manage account</p>
                </div>
              </div>
            </Link>
          </div>
      </div>
  );
}
