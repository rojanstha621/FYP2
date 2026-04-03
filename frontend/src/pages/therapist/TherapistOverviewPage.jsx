import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiUsers } from 'react-icons/fi';
import { assignmentAPI, videoAPI } from '../../services/api';

export default function TherapistOverviewPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [videoByPatientId, setVideoByPatientId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [assignmentRes, groupedRes] = await Promise.all([
        assignmentAPI.getAssignments(),
        videoAPI.getAssignmentsByPatient(),
      ]);

      const assignmentItems = assignmentRes?.data?.results || assignmentRes?.data?.result || assignmentRes?.data || [];
      const patientMap = new Map();
      assignmentItems.forEach((item) => {
        const pid = String(item?.patient || item?.patient_details?.id || '');
        if (!pid) return;
        if (!patientMap.has(pid)) {
          patientMap.set(pid, {
            patient_id: pid,
            patient_name:
              `${item?.patient_details?.first_name || ''} ${item?.patient_details?.last_name || ''}`.trim() ||
              `Patient #${pid}`,
            email: item?.patient_details?.email || '',
            is_active: Boolean(item?.is_active),
          });
        }
      });
      setPatients(Array.from(patientMap.values()));

      const source = Array.isArray(groupedRes?.data) ? groupedRes.data : [];
      const summaryMap = source.reduce((acc, item) => {
        const patientId = String(item?.patient?.id || '');
        const assignments = Array.isArray(item?.assignments) ? item.assignments : [];
        if (!patientId) return acc;

        const scheduledAssignments = assignments.filter((a) => a?.is_scheduled);
        const scheduledDaysTotal = scheduledAssignments.reduce(
          (sum, a) => sum + Number(a?.schedule_progress?.total_days || 0),
          0
        );
        const scheduledDaysViewed = scheduledAssignments.reduce(
          (sum, a) => sum + Number(a?.schedule_progress?.viewed_days || 0),
          0
        );

        acc[patientId] = {
          assignmentsTotal: Number(item?.assignment_count || assignments.length || 0),
          scheduledAssignments: scheduledAssignments.length,
          scheduledDaysTotal,
          scheduledDaysViewed,
        };
        return acc;
      }, {});

      setVideoByPatientId(summaryMap);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-2xl p-6 bg-palette-cream border border-palette-mauve/20 animate-pulse">
          <div className="h-8 w-72 bg-palette-beige rounded mb-3" />
          <div className="h-4 w-96 bg-palette-beige rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <section className="rounded-2xl p-6 bg-gradient-to-r from-palette-mauve/20 via-palette-blush/20 to-palette-beige border border-palette-mauve/20 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-palette-dark">Therapist Overview</h1>
            <p className="mt-2 text-palette-dark/70 max-w-2xl">
              Track patient video schedule performance from one dashboard.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-palette-cream/80 border border-palette-mauve/20 text-palette-dark/80 text-sm">
            <FiUsers /> {patients.length} assigned patients
          </div>
        </div>
      </section>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {patients.map((patient) => {
          const video = videoByPatientId[patient.patient_id] || {
            assignmentsTotal: 0,
            scheduledAssignments: 0,
            scheduledDaysTotal: 0,
            scheduledDaysViewed: 0,
          };

          return (
            <div
              key={patient.patient_id}
              className="rounded-2xl p-5 text-left shadow-sm border bg-palette-cream border-palette-mauve/20"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-palette-dark">{patient.patient_name}</h2>
                {!patient.is_active && (
                  <span className="text-xs px-2 py-1 rounded-full bg-palette-beige text-palette-dark/70">Inactive</span>
                )}
              </div>

              {patient.email && <p className="text-sm text-palette-dark/70 mt-1">{patient.email}</p>}

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-palette-cream/80 p-2 text-palette-dark/80">Videos: <span className="font-semibold">{video.assignmentsTotal}</span></div>
                <div className="rounded-lg bg-palette-cream/80 p-2 text-palette-dark/80">Scheduled: <span className="font-semibold">{video.scheduledAssignments}</span></div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-palette-dark/70 mb-1">
                  <span>Video Schedule Progress</span>
                  <span>{video.scheduledDaysViewed} / {video.scheduledDaysTotal}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-palette-beige">
                  <div
                    className="h-2.5 rounded-full bg-palette-mauve"
                    style={{
                      width: `${video.scheduledDaysTotal > 0 ? (video.scheduledDaysViewed / video.scheduledDaysTotal) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate(`/therapist/videos?patient=${patient.patient_id}`)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-palette-mauve hover:text-palette-dark"
                >
                  Open Video Assignments <FiArrowRight />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {patients.length === 0 && (
        <div className="rounded-2xl bg-palette-cream p-5 shadow-sm border border-palette-mauve/20 text-palette-dark/70">
          No assigned patients found.
        </div>
      )}
    </div>
  );
}
