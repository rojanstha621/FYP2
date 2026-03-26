import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { getFeedback, sendFeedback } from '../../api/feedbackApi';
import { getTherapistOverview } from '../../api/progressApi';
import { getSessions } from '../../api/sessionsApi';

export default function SendFeedbackPage() {
  const [patients, setPatients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);

  const [patientId, setPatientId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filteredSessions = useMemo(() => {
    if (!patientId) return [];
    return sessions.filter((session) => String(session.patient) === String(patientId));
  }, [sessions, patientId]);

  const groupedFeedback = useMemo(() => {
    const grouped = {};
    feedbackItems.forEach((item) => {
      const key = String(item.patient);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  }, [feedbackItems]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [overviewData, sessionsData, feedbackData] = await Promise.all([
        getTherapistOverview(),
        getSessions(),
        getFeedback(),
      ]);

      setPatients(overviewData || []);
      setSessions(sessionsData || []);
      setFeedbackItems(feedbackData.items || []);

      if (overviewData?.length > 0) {
        setPatientId(String(overviewData[0].patient_id));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feedback workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await sendFeedback({
        patient: patientId,
        session: sessionId || null,
        message,
      });

      setSuccess('Feedback sent successfully');
      setMessage('');
      setSessionId('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 rounded-xl border border-palette-mauve/20 bg-palette-cream/70 px-5 py-4">
        <h1 className="text-3xl font-bold text-palette-dark">Send Feedback</h1>
        <p className="mt-1 text-sm text-palette-dark/70">
          Share guidance with your patients and track previously sent feedback.
        </p>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-700">{success}</div>}

      <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-palette-mauve/20 bg-palette-cream p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-palette-dark">Patient</label>
            <select
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                setSessionId('');
              }}
              required
              className="w-full rounded-md border border-palette-mauve/30 bg-palette-beige/30 px-3 py-2 text-palette-dark focus:outline-none focus:ring-2 focus:ring-palette-mauve"
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.patient_id} value={patient.patient_id}>
                  {patient.patient_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-palette-dark">Session (optional)</label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full rounded-md border border-palette-mauve/30 bg-palette-beige/30 px-3 py-2 text-palette-dark focus:outline-none focus:ring-2 focus:ring-palette-mauve"
            >
              <option value="">No linked session</option>
              {filteredSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  Session #{session.id} ({session.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-palette-dark">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full rounded-md border border-palette-mauve/30 bg-palette-beige/30 px-3 py-2 text-palette-dark focus:outline-none focus:ring-2 focus:ring-palette-mauve"
            placeholder="Write feedback for your patient"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-md bg-palette-mauve px-4 py-2 text-white hover:bg-palette-dark disabled:opacity-50"
        >
          {submitting ? 'Sending...' : 'Send Feedback'}
        </button>
      </form>

      <div className="rounded-lg border border-palette-mauve/20 bg-palette-cream p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-palette-dark">Sent Feedback by Patient</h2>

        {Object.keys(groupedFeedback).length === 0 ? (
          <p className="text-sm text-palette-dark/70">No sent feedback yet.</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedFeedback).map(([pId, items]) => {
              const patient = patients.find((p) => String(p.patient_id) === String(pId));
              return (
                <div key={pId} className="rounded-md bg-palette-beige/60 border border-palette-mauve/20 p-4">
                  <h3 className="mb-2 font-semibold text-palette-dark">
                    {patient?.patient_name || `Patient #${pId}`}
                  </h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="rounded border border-palette-mauve/20 bg-palette-cream/75 p-3 text-sm">
                        <p className="text-palette-dark/80">{item.message}</p>
                        <p className="mt-1 text-xs text-palette-dark/60">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
