import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiActivity, FiArrowRight, FiCalendar, FiClock, FiPlayCircle, FiUsers } from 'react-icons/fi';
import { getDailyProgress, getTherapistOverview } from '../../api/progressApi';
import { videoAPI } from '../../services/api';

const toDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TherapistOverviewPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dailyProgress, setDailyProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState('');
  const [dailyError, setDailyError] = useState('');
  const [date, setDate] = useState(toDateInput(new Date()));
  const [videoByPatientId, setVideoByPatientId] = useState({});

  const completionPercent = Math.min(Math.max(Number(dailyProgress?.completion_percentage || 0), 0), 100);

  const selectedPatientId = useMemo(
    () => (selectedPatient ? selectedPatient.patient_id : null),
    [selectedPatient]
  );

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getTherapistOverview();
      setPatients(data);
      if (data.length > 0) {
        setSelectedPatient(data[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load therapist overview');
    } finally {
      setLoading(false);
    }
  };

  const loadVideoOverview = async () => {
    try {
      setVideoLoading(true);
      setVideoError('');
      const grouped = await videoAPI.getAssignmentsByPatient();
      const source = Array.isArray(grouped?.data) ? grouped.data : [];

      const summaryMap = source.reduce((acc, item) => {
        const patientId = item?.patient?.id;
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
      setVideoError(err.response?.data?.message || 'Failed to load video overview');
    } finally {
      setVideoLoading(false);
    }
  };

  const loadDailyProgress = async (patientId, day) => {
    if (!patientId) return;
    try {
      setDailyLoading(true);
      setDailyError('');
      const data = await getDailyProgress(day, patientId);
      setDailyProgress(data);
    } catch (err) {
      setDailyError(err.response?.data?.message || 'Failed to load daily progress');
    } finally {
      setDailyLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    loadVideoOverview();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadDailyProgress(selectedPatientId, date);
    }
  }, [selectedPatientId, date]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-2xl p-6 bg-gradient-to-r from-palette-mauve/25 via-palette-blush/25 to-palette-beige border border-palette-mauve/20 animate-pulse">
          <div className="h-8 w-72 bg-palette-cream/80 rounded mb-3" />
          <div className="h-4 w-96 bg-palette-cream/70 rounded" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="rounded-2xl bg-palette-cream p-5 shadow-sm border border-palette-mauve/15 animate-pulse">
                <div className="h-5 w-40 bg-palette-beige rounded" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((inner) => (
                    <div key={inner} className="h-4 bg-palette-beige rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-palette-cream p-5 shadow-sm border border-palette-mauve/15 animate-pulse">
            <div className="h-5 w-48 bg-palette-beige rounded mb-4" />
            <div className="h-10 w-40 bg-palette-beige rounded mb-4" />
            <div className="h-3 w-full bg-palette-beige rounded" />
          </div>
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
              Track patient exercise adherence and video schedule performance from one dashboard.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-palette-cream/80 border border-palette-mauve/20 text-palette-dark/80 text-sm">
            <FiUsers /> {patients.length} assigned patients
          </div>
        </div>
      </section>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {videoError && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
              {videoError}
            </div>
          )}

          {patients.length === 0 && (
            <div className="rounded-2xl bg-palette-cream p-4 text-palette-dark/70 shadow-sm border border-palette-mauve/20">
              No assigned patients found.
            </div>
          )}

          {patients.map((patient) => {
            const video = videoByPatientId[patient.patient_id] || {
              assignmentsTotal: 0,
              scheduledAssignments: 0,
              scheduledDaysTotal: 0,
              scheduledDaysViewed: 0,
            };

            return (
            <button
              type="button"
              key={patient.patient_id}
              onClick={() => setSelectedPatient(patient)}
              className={`w-full rounded-2xl p-5 text-left shadow-sm border transition-all ${
                selectedPatientId === patient.patient_id
                  ? 'bg-gradient-to-br from-palette-mauve/20 to-palette-blush/20 border-palette-mauve scale-[1.01]'
                  : 'bg-palette-cream border-palette-mauve/20 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-palette-dark">{patient.patient_name}</h2>
                {selectedPatientId === patient.patient_id && (
                  <span className="text-xs px-2 py-1 rounded-full bg-palette-dark text-white">Selected</span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-palette-cream/80 p-2 text-palette-dark/80">Sessions: <span className="font-semibold">{patient.total_sessions_all_time}</span></div>
                <div className="rounded-lg bg-palette-cream/80 p-2 text-palette-dark/80">Completed: <span className="font-semibold">{patient.completed_all_time}</span></div>
                <div className="rounded-lg bg-palette-cream/80 p-2 text-palette-dark/80">Streak: <span className="font-semibold">{patient.current_streak}</span></div>
                <div className="rounded-lg bg-palette-cream/80 p-2 text-palette-dark/80">Last: <span className="font-semibold">{patient.last_session_date ? new Date(patient.last_session_date).toLocaleDateString() : 'N/A'}</span></div>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/therapist/videos?patient=${patient.patient_id}`);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-palette-mauve hover:text-palette-dark"
                >
                  Open Video Assignments <FiArrowRight />
                </button>
              </div>
            </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-palette-cream p-5 shadow-sm border border-palette-mauve/20">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-palette-dark inline-flex items-center gap-2">
              <FiActivity />
              {selectedPatient ? `${selectedPatient.patient_name} Daily Progress` : 'Daily Progress'}
            </h2>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-palette-mauve/30 px-3 py-2 bg-palette-beige/40"
            />
          </div>

          {dailyLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-48 bg-palette-beige rounded" />
              <div className="h-3 w-full bg-palette-beige rounded" />
              <div className="h-4 w-40 bg-palette-beige rounded" />
            </div>
          ) : dailyError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{dailyError}</div>
          ) : dailyProgress ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-palette-beige/40 border border-palette-mauve/15 p-3">
                  <p className="text-xs text-palette-dark/70 inline-flex items-center gap-1"><FiClock /> Total Duration</p>
                  <p className="text-xl font-bold text-palette-dark mt-1">
                    {Math.round((dailyProgress.total_duration_seconds || 0) / 60)} min
                  </p>
                </div>
                <div className="rounded-xl bg-palette-beige/40 border border-palette-mauve/15 p-3">
                  <p className="text-xs text-palette-dark/70 inline-flex items-center gap-1"><FiPlayCircle /> Session Completion</p>
                  <p className="text-xl font-bold text-palette-dark mt-1">
                    {dailyProgress.completed_sessions} / {dailyProgress.total_sessions}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-palette-dark/80 mb-1">
                  <span>Daily Completion</span>
                  <span className="font-semibold">{completionPercent}%</span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-palette-beige">
                  <div
                    className="h-3.5 rounded-full bg-gradient-to-r from-palette-mauve to-palette-dark"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm text-palette-dark/80 mb-1">
                  <span>Video Schedule Completion</span>
                  <span className="font-semibold">
                    {videoByPatientId[selectedPatientId]?.scheduledDaysViewed || 0} / {videoByPatientId[selectedPatientId]?.scheduledDaysTotal || 0}
                  </span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-palette-beige">
                  <div
                    className="h-3.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                    style={{
                      width: `${(videoByPatientId[selectedPatientId]?.scheduledDaysTotal || 0) > 0
                        ? ((videoByPatientId[selectedPatientId]?.scheduledDaysViewed || 0) / (videoByPatientId[selectedPatientId]?.scheduledDaysTotal || 1)) * 100
                        : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-palette-mauve/20 bg-palette-beige/30 p-2 text-palette-dark/80 inline-flex items-center gap-2">
                  <FiUsers /> Active patient selected
                </div>
                <div className="rounded-lg border border-palette-mauve/20 bg-palette-beige/30 p-2 text-palette-dark/80 inline-flex items-center gap-2">
                  <FiCalendar /> {date}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-palette-dark/70">Select a patient to see daily progress.</p>
          )}

          {videoLoading && <p className="mt-3 text-sm text-palette-dark/60">Loading video stats...</p>}
        </div>
      </div>
    </div>
  );
}
