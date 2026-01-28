import { useEffect, useState } from 'react';
import { assignmentAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export default function TherapistPendingRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [requests, setRequests] = useState([]);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await assignmentAPI.getPending();
      setRequests(res.data.result || res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await assignmentAPI.activateAssignment(id);
      setSuccess('Request approved');
      setError(null);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setApproving(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Pending Patient Requests</h1>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        {loading ? (
          <Spinner />
        ) : (
          <div className="bg-white rounded-lg shadow divide-y">
            {requests.length ? (
              requests.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {r.patient_details?.first_name} {r.patient_details?.last_name} - Assignment Request
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{r.patient_details?.email}</div>
                    {r.patient_details?.phone_number && (
                      <div className="text-sm text-gray-600">{r.patient_details?.phone_number}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={approving === r.id}
                    className="btn-primary"
                  >
                    {approving === r.id ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              ))
            ) : (
              <p className="p-4 text-gray-600">No pending requests from patients.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
