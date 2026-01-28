import { useEffect, useState } from 'react';
import { therapistAPI, authAPI, assignmentAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { Link, useNavigate } from 'react-router-dom';

export default function ApprovedTherapistsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [bookingLoading, setBookingLoading] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [approvedRes, dashboardRes] = await Promise.all([
        therapistAPI.getApproved(),
        authAPI.getPatientDashboard(),
      ]);
      const approved = approvedRes.data.result || approvedRes.data || [];
      setTherapists(approved);
      const assigned = dashboardRes.data.result?.assigned_therapist ? [dashboardRes.data.result.assigned_therapist.id] : [];
      setAssignedIds(new Set(assigned));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load therapists');
    } finally {
      setLoading(false);
    }
  };

  const handleBookTherapist = async (therapistId) => {
    try {
      setBookingLoading(therapistId);
      await assignmentAPI.requestAssignment(therapistId);
      setSuccess('Assignment request sent successfully!');
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send assignment request');
    } finally {
      setBookingLoading(null);
    }
  };

  const filtered = therapists.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.first_name?.toLowerCase() || '').includes(q) ||
      (t.last_name?.toLowerCase() || '').includes(q) ||
      (t.email?.toLowerCase() || '').includes(q) ||
      (t.phone_number || '').includes(q)
    );
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Approved Therapists</h1>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess(null)} />
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length ? (
              filtered.map((t) => (
                <div key={t.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-200">
                  {/* Therapist Avatar */}
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-32 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-bold text-blue-600">
                        {t.first_name?.[0]}{t.last_name?.[0]}
                      </span>
                    </div>
                  </div>

                  {/* Therapist Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        {t.first_name} {t.last_name}
                      </h3>
                      {assignedIds.has(String(t.id)) && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Assigned
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {t.email}
                      </div>
                      {t.phone_number && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {t.phone_number}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        to={`/therapists/${t.id}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium text-center transition-colors"
                      >
                        View Details
                      </Link>
                      {!assignedIds.has(String(t.id)) && (
                        <button
                          onClick={() => handleBookTherapist(t.id)}
                          disabled={bookingLoading === t.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                          {bookingLoading === t.id ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Booking...
                            </span>
                          ) : (
                            'Book Now'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="mt-4 text-gray-600">No therapists found.</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
