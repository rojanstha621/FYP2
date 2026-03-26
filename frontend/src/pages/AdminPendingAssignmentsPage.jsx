import { useEffect, useState } from 'react';
import { assignmentAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export default function AdminPendingAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [activating, setActivating] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;
    return [];
  };

  const fetchPending = async () => {
    try {
      const res = await assignmentAPI.getPending();
      setAssignments(extractList(res.data));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const confirmed = window.confirm('Approve this assignment request?');
    if (!confirmed) return;

    setActivating(id);
    try {
      await assignmentAPI.activateAssignment(id);
      setSuccess('Assignment approved');
      setError(null);
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve assignment');
    } finally {
      setActivating(null);
    }
  };

  const handleReject = async (id) => {
    const confirmed = window.confirm('Reject this assignment request? This cannot be undone.');
    if (!confirmed) return;

    setRejecting(id);
    try {
      await assignmentAPI.rejectAssignment(id);
      setSuccess('Assignment rejected');
      setError(null);
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject assignment');
    } finally {
      setRejecting(null);
    }
  };

  return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-palette-dark mb-6">Pending Assignment Requests</h1>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        {loading ? (
          <Spinner />
        ) : (
          <div className="bg-palette-cream rounded-lg shadow border border-palette-mauve/20 divide-y divide-palette-mauve/20">
            {assignments.length ? (
              assignments.map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between hover:bg-palette-beige/30 transition-colors">
                  <div>
                    <div className="font-semibold text-palette-dark">
                      {a.patient_details?.first_name} {a.patient_details?.last_name} → {a.therapist_details?.first_name} {a.therapist_details?.last_name}
                    </div>
                    <div className="text-sm text-palette-dark/70 mt-1">
                      Patient: {a.patient_details?.email}
                    </div>
                    <div className="text-sm text-palette-dark/70">
                      Therapist: {a.therapist_details?.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(a.id)}
                      disabled={activating === a.id || rejecting === a.id}
                      className="btn-primary"
                    >
                      {activating === a.id ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(a.id)}
                      disabled={rejecting === a.id || activating === a.id}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-red-700 border border-red-300 bg-red-50 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {rejecting === a.id ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-palette-dark/70">No pending requests.</p>
            )}
          </div>
        )}
      </div>
  );
}
