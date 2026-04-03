import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { getFeedback, sendFeedback } from '../../api/feedbackApi';
import { assignmentAPI } from '../../services/api';

export default function SendFeedbackPage() {
  const [patients, setPatients] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);

  const [patientId, setPatientId] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const [assignmentRes, feedbackData] = await Promise.all([
        assignmentAPI.getAssignments(),
        getFeedback(),
      ]);

      const assignmentItems = assignmentRes?.data?.results || assignmentRes?.data?.result || assignmentRes?.data || [];
      const uniquePatients = [];
      const seenPatientIds = new Set();
      assignmentItems.forEach((item) => {
        const pid = String(item?.patient || item?.patient_details?.id || '');
        if (!pid || seenPatientIds.has(pid)) return;
        seenPatientIds.add(pid);
        uniquePatients.push({
          patient_id: pid,
          patient_name:
            `${item?.patient_details?.first_name || ''} ${item?.patient_details?.last_name || ''}`.trim() ||
            `Patient #${pid}`,
        });
      });

      setPatients(uniquePatients);
      setFeedbackItems(feedbackData.items || []);

      if (uniquePatients.length > 0) {
        setPatientId(String(uniquePatients[0].patient_id));
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
        message,
      });

      setSuccess('Feedback sent successfully');
      setMessage('');
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

          <div className="hidden md:block" />
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
