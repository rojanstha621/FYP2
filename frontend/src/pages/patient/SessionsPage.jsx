import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../../components/Spinner';
import { getSessions } from '../../api/sessionsApi';

const statusClasses = {
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  skipped: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-800',
};

const statusLabel = (status) => (status || '').replace('_', ' ');

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getSessions();
        setSessions(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-palette-dark">My Sessions</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="rounded-lg bg-palette-cream p-8 text-center text-palette-dark/70">
          No sessions found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session) => {
            const completedSets = Number(session.total_sets_completed || 0);
            return (
              <div key={session.id} className="rounded-lg border border-palette-mauve/20 bg-palette-cream p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-palette-dark">
                    {session.exercise_plan_name || `Exercise Plan #${session.exercise_plan}`}
                  </h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[session.status] || 'bg-palette-beige text-palette-dark'}`}>
                    {statusLabel(session.status)}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-palette-dark/80">
                  <p>
                    <span className="font-medium">Started:</span>{' '}
                    {session.start_time ? new Date(session.start_time).toLocaleString() : 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Total sets completed:</span> {completedSets}
                  </p>
                </div>

                <div className="mt-4">
                  <Link
                    to={`/patient/sessions/${session.id}`}
                    className="inline-flex items-center rounded-md bg-palette-mauve px-4 py-2 text-sm font-medium text-white hover:bg-palette-dark"
                  >
                    View Session Detail
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
