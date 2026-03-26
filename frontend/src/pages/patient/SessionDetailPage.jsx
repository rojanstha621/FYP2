import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Spinner } from '../../components/Spinner';
import {
  completeSession,
  getSessions,
  getSetLogs,
  logSet,
  skipSession,
} from '../../api/sessionsApi';

export default function SessionDetailPage() {
  const { id } = useParams();
  const sessionId = useMemo(() => Number(id), [id]);

  const [session, setSession] = useState(null);
  const [setLogs, setSetLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notes, setNotes] = useState('');
  const [formData, setFormData] = useState({
    set_number: '',
    reps_completed: '',
    duration_seconds: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [sessionsData, logsData] = await Promise.all([
        getSessions(),
        getSetLogs(sessionId),
      ]);

      const found = sessionsData.find((item) => Number(item.id) === sessionId);
      if (!found) {
        setError('Session not found');
        setSession(null);
      } else {
        setSession(found);
      }

      setSetLogs(logsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  const handleLogSet = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await logSet(sessionId, {
        set_number: Number(formData.set_number),
        reps_completed: Number(formData.reps_completed),
        duration_seconds: Number(formData.duration_seconds),
        completed: true,
      });

      setSuccess('Set logged successfully');
      setFormData({ set_number: '', reps_completed: '', duration_seconds: '' });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log set');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await completeSession(sessionId, notes);
      setSuccess('Session completed');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await skipSession(sessionId, notes);
      setSuccess('Session skipped');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to skip session');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link to="/patient/sessions" className="text-sm text-palette-mauve hover:text-palette-dark">
          Back to sessions
        </Link>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-700">{success}</div>}

      {session ? (
        <>
          <div className="mb-6 rounded-lg border border-palette-mauve/20 bg-palette-cream p-5">
            <h1 className="mb-2 text-2xl font-bold text-palette-dark">
              {session.exercise_plan_name || `Exercise Plan #${session.exercise_plan}`}
            </h1>
            <div className="space-y-1 text-sm text-palette-dark/80">
              <p><span className="font-medium">Status:</span> {session.status}</p>
              <p><span className="font-medium">Started:</span> {session.start_time ? new Date(session.start_time).toLocaleString() : 'N/A'}</p>
              <p><span className="font-medium">Ended:</span> {session.end_time ? new Date(session.end_time).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-palette-mauve/20 bg-palette-cream p-5">
            <h2 className="mb-4 text-xl font-semibold text-palette-dark">Set Logs</h2>
            {setLogs.length === 0 ? (
              <p className="text-sm text-palette-dark/70">No set logs yet.</p>
            ) : (
              <div className="space-y-3">
                {setLogs.map((setLog) => (
                  <div key={setLog.id} className="rounded-md bg-white p-3 shadow-sm">
                    <p className="text-sm font-medium text-palette-dark">Set {setLog.set_number}</p>
                    <p className="text-sm text-palette-dark/80">Reps: {setLog.reps_completed}</p>
                    <p className="text-sm text-palette-dark/80">Duration: {setLog.duration_seconds}s</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {session.status === 'in_progress' && (
            <div className="space-y-6">
              <form onSubmit={handleLogSet} className="rounded-lg border border-palette-mauve/20 bg-palette-cream p-5">
                <h3 className="mb-4 text-lg font-semibold text-palette-dark">Log New Set</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.set_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, set_number: e.target.value }))}
                    placeholder="Set number"
                    className="rounded-md border border-palette-mauve/30 px-3 py-2"
                  />
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.reps_completed}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reps_completed: e.target.value }))}
                    placeholder="Reps completed"
                    className="rounded-md border border-palette-mauve/30 px-3 py-2"
                  />
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.duration_seconds}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duration_seconds: e.target.value }))}
                    placeholder="Duration (seconds)"
                    className="rounded-md border border-palette-mauve/30 px-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 rounded-md bg-palette-mauve px-4 py-2 text-white hover:bg-palette-dark disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Log Set'}
                </button>
              </form>

              <div className="rounded-lg border border-palette-mauve/20 bg-palette-cream p-5">
                <h3 className="mb-3 text-lg font-semibold text-palette-dark">Finalize Session</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full rounded-md border border-palette-mauve/30 px-3 py-2"
                  rows={3}
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={submitting}
                    className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Complete Session
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={submitting}
                    className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    Skip Session
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg bg-palette-cream p-6 text-center text-palette-dark/70">Session not found.</div>
      )}
    </div>
  );
}
