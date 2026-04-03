import { useEffect, useState } from 'react';
import { therapistAPI, authAPI, assignmentAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { Link } from 'react-router-dom';

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const normalizeImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
};

const buildFallbackAvatar = (firstName, lastName) => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Therapist';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=987185&color=ffffff&size=256&bold=true`;
};

export default function ApprovedTherapistsPage() {
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
        therapistAPI.getApproved({ page_size: 1000 }),
        authAPI.getPatientDashboard(),
      ]);
      const approved = toArray(approvedRes.data);
      setTherapists(approved);
      const dashboard = dashboardRes.data?.result || dashboardRes.data || {};
      const assigned = Array.isArray(dashboard?.assigned_therapists)
        ? dashboard.assigned_therapists.map((item) => String(item.id))
        : dashboard?.assigned_therapist
          ? [String(dashboard.assigned_therapist.id)]
          : [];
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-2xl border border-palette-mauve/20 bg-palette-cream p-6 md:p-8 mb-8 shadow-sm">
          <div className="absolute -top-16 -right-8 h-40 w-40 rounded-full bg-palette-blush/35 blur-2xl" />
          <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-palette-beige/50 blur-2xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.24em] text-palette-dark/70 font-semibold mb-2">
              Therapist Directory
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-palette-dark leading-tight">
              Find The Right Therapist
            </h1>
            <p className="text-palette-dark/70 mt-2 max-w-2xl">
              Browse approved therapists, review details, and send a request in one click.
            </p>
          </div>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess(null)} />
        )}

        <div className="bg-palette-cream border border-palette-mauve/20 rounded-2xl shadow-sm p-4 md:p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <svg className="w-5 h-5 text-palette-dark/45 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-4.65a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone"
                className="w-full pl-10 pr-3 py-3 border border-palette-mauve/30 rounded-xl bg-palette-beige/30 text-palette-dark focus:outline-none focus:ring-2 focus:ring-palette-mauve"
              />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-palette-beige text-palette-dark font-semibold self-start md:self-auto">
              <span className="text-lg">{filtered.length}</span>
              <span className="text-sm text-palette-dark/80">therapists found</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.length ? (
              filtered.map((t) => (
                <div key={t.id} className="group bg-palette-cream rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-palette-mauve/20 hover:-translate-y-0.5">
                  <div className="h-1.5 bg-gradient-to-r from-palette-mauve via-palette-blush to-palette-dark" />

                  <div className="px-6 pt-6 pb-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={normalizeImageUrl(t.profile_picture) || buildFallbackAvatar(t.first_name, t.last_name)}
                          alt={`${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Therapist'}
                          className="w-14 h-14 rounded-xl object-cover shadow-sm shrink-0 border border-palette-mauve/20"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-palette-dark truncate">
                            {t.first_name} {t.last_name}
                          </h3>
                          <p className="text-xs uppercase tracking-wider text-palette-dark/55">Approved Therapist</p>
                        </div>
                      </div>
                      {assignedIds.has(String(t.id)) && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-palette-blush/40 text-palette-dark border border-palette-mauve/30">
                          Assigned
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 mb-5 text-sm">
                      <div className="flex items-center gap-2 text-palette-dark/80 break-all">
                        <svg className="w-4 h-4 text-palette-mauve shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{t.email}</span>
                      </div>
                      {t.phone_number && (
                        <div className="flex items-center gap-2 text-palette-dark/80">
                          <svg className="w-4 h-4 text-palette-mauve shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{t.phone_number}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2.5">
                      <Link
                        to={`/therapists/${t.id}`}
                        className="flex-1 bg-palette-mauve hover:bg-palette-dark text-white py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-colors"
                      >
                        View Profile
                      </Link>
                      {!assignedIds.has(String(t.id)) && (
                        <button
                          onClick={() => handleBookTherapist(t.id)}
                          disabled={bookingLoading === t.id}
                          className="flex-1 bg-palette-dark hover:bg-palette-mauve disabled:bg-palette-dark/35 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors"
                        >
                          {bookingLoading === t.id ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin h-4 w-4 mr-1.5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Requesting...
                            </span>
                          ) : (
                            'Request Therapist'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-14 bg-palette-cream border border-palette-mauve/20 rounded-2xl shadow-sm">
                <svg className="mx-auto h-12 w-12 text-palette-dark/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="mt-4 text-palette-dark/75 font-semibold">No therapists found.</p>
                <p className="text-sm text-palette-dark/55 mt-1">Try a different search keyword.</p>
              </div>
            )}
          </div>
        )}
      </div>
  );
}
