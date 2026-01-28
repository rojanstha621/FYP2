import { useEffect, useState } from 'react';
import { assignmentAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export default function AdminPendingAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [activating, setActivating] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await assignmentAPI.getPending();
      setAssignments(res.data.result || res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Pending Assignment Requests</h1>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        {loading ? (
          <Spinner />
        ) : (
          <div className="bg-white rounded-lg shadow divide-y">
            {assignments.length ? (
              assignments.map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {a.patient_details?.first_name} {a.patient_details?.last_name} → {a.therapist_details?.first_name} {a.therapist_details?.last_name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Patient: {a.patient_details?.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      Therapist: {a.therapist_details?.email}
                    </div>
                  </div>
                  <button
                    onClick={() => handleApprove(a.id)}
                    disabled={activating === a.id}
                    className="btn-primary"
                  >
                    {activating === a.id ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              ))
            ) : (
              <p className="p-4 text-gray-600">No pending requests.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
