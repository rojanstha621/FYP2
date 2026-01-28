import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { therapistAPI, assignmentAPI, medicalAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export default function TherapistDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [therapist, setTherapist] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [detailRes, assignmentsRes] = await Promise.all([
          therapistAPI.getById(id),
          assignmentAPI.getAssignments(),
        ]);
        const data = detailRes.data.result || detailRes.data;
        setTherapist(data);
        setAssignments(assignmentsRes.data.result || assignmentsRes.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load therapist');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const assignmentStatus = (() => {
    const match = assignments.find((a) => String(a.therapist) === String(id) || String(a.therapist?.id) === String(id));
    if (!match) return 'none';
    return match.is_active ? 'assigned' : 'pending';
  })();

  const handleRequestAssignment = async () => {
    setRequesting(true);
    try {
      await assignmentAPI.requestAssignment(id);
      setError(null);
      // Refresh assignments
      const res = await assignmentAPI.getAssignments();
      setAssignments(res.data.result || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request assignment');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Therapist Details</h1>
          <Link to="/therapists" className="text-palette-mauve hover:underline">Back to list</Link>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {loading ? (
          <Spinner />
        ) : therapist ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              {therapist.profile?.profile_picture && (
                <img
                  src={therapist.profile.profile_picture}
                  alt="Profile"
                  className="w-24 h-24 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <div className="text-xl font-semibold">
                  {therapist.first_name} {therapist.last_name}
                </div>
                <div className="mt-2 text-gray-700">{therapist.email}</div>
                {therapist.phone_number && (
                  <div className="mt-1 text-gray-700">{therapist.phone_number}</div>
                )}
                {therapist.profile?.bio && (
                  <div className="mt-3 text-gray-700 whitespace-pre-line">{therapist.profile.bio}</div>
                )}
              </div>
            </div>

            <div className="mt-6">
              {assignmentStatus === 'assigned' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Assigned</span>
              )}
              {assignmentStatus === 'pending' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Pending Approval</span>
              )}
              {assignmentStatus === 'none' && (
                <button
                  onClick={handleRequestAssignment}
                  disabled={requesting}
                  className="btn-primary mt-2"
                >
                  {requesting ? 'Requesting...' : 'Request Assignment'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No therapist details found.</p>
        )}
      </div>
    </Layout>
  );
}
