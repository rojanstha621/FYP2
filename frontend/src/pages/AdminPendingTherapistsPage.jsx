import { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export default function AdminPendingTherapistsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await adminAPI.getPendingTherapists();
      setTherapists(res.data.result || res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending therapists');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await adminAPI.approveTherapist(id);
      setSuccess('Therapist approved successfully');
      setError(null);
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve therapist');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    setProcessing(id);
    try {
      await adminAPI.rejectTherapist(id);
      setSuccess('Therapist rejected');
      setError(null);
      fetchPending();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject therapist');
    } finally {
      setProcessing(null);
    }
  };

  return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Pending Therapist Approvals</h1>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        {loading ? (
          <Spinner />
        ) : (
          <div className="bg-palette-cream rounded-lg shadow divide-y">
            {therapists.length ? (
              therapists.map((therapist) => (
                <div key={therapist.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">
                        {therapist.first_name} {therapist.last_name}
                      </div>
                      <div className="text-sm text-palette-dark/70 mt-1">{therapist.email}</div>
                      {therapist.phone_number && (
                        <div className="text-sm text-palette-dark/70">{therapist.phone_number}</div>
                      )}
                      <div className="mt-2">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          {therapist.therapist_status || 'PENDING'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(therapist.id)}
                        disabled={processing === therapist.id}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {processing === therapist.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(therapist.id)}
                        disabled={processing === therapist.id}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {processing === therapist.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-palette-dark/70">No pending therapist approvals.</p>
            )}
          </div>
        )}
      </div>
  );
}
