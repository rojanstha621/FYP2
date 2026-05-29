import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiUsers } from 'react-icons/fi';
import { assignmentAPI, videoAPI, appointmentAPI, nursingNotesAPI } from '../../services/api';

export default function TherapistOverviewPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [videoByPatientId, setVideoByPatientId] = useState({});
  const [assignmentsByPatientId, setAssignmentsByPatientId] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [nursingNotes, setNursingNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [assignmentRes, groupedRes, appointmentRes, notesRes] = await Promise.all([
        assignmentAPI.getAssignments(),
        videoAPI.getAssignmentsByPatient(),
        appointmentAPI.getAppointments(),
        nursingNotesAPI.getNotes(),
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
        const missedDays = scheduledAssignments.reduce(
          (sum, a) => sum + Number(a?.schedule_progress?.missed_days || 0),
          0
        );
        const pendingDays = scheduledAssignments.reduce(
          (sum, a) => sum + Number(a?.schedule_progress?.pending_days || 0),
          0
        );

        acc[patientId] = {
          assignmentsTotal: Number(item?.assignment_count || assignments.length || 0),
          scheduledAssignments: scheduledAssignments.length,
          scheduledDaysTotal,
          scheduledDaysViewed,
          missedDays,
          pendingDays,
        };

        const normalizedAssignments = assignments
          .map((assignment) => ({
            id: assignment?.id,
            title: assignment?.video_details?.title || assignment?.video?.title || 'Untitled video',
            assignedAt: assignment?.assigned_at,
            repeatCount: Number(assignment?.repeat_count || 1),
            isScheduled: Boolean(assignment?.is_scheduled),
            scheduleStartDate: assignment?.schedule_start_date,
            scheduleDurationDays: Number(assignment?.schedule_duration_days || 0),
            scheduledTime: assignment?.scheduled_time,
            viewedDays: Number(assignment?.schedule_progress?.viewed_days || 0),
            totalDays: Number(assignment?.schedule_progress?.total_days || assignment?.schedule_duration_days || 0),
            patientName:
              `${item?.patient?.first_name || item?.patient_details?.first_name || ''} ${item?.patient?.last_name || item?.patient_details?.last_name || ''}`.trim() ||
              item?.patient?.email ||
              item?.patient_details?.email ||
              'Patient',
          }))
          .sort((left, right) => new Date(right.assignedAt || 0) - new Date(left.assignedAt || 0));

        acc[patientId] = {
          ...acc[patientId],
          assignments: normalizedAssignments,
        };
        return acc;
      }, {});

      setVideoByPatientId(summaryMap);
      setAssignmentsByPatientId(
        Object.fromEntries(
          Object.entries(summaryMap).map(([patientId, value]) => [patientId, value.assignments || []]),
        ),
      );

      setAppointments(extractList(appointmentRes.data));
      setNursingNotes(extractList(notesRes.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const patientNoteMap = useMemo(() => nursingNotes.reduce((acc, note) => {
    if (note?.note_type !== 'FOLLOW_UP') return acc;
    const patientId = String(note?.patient?.id || note?.patient || '');
    if (!patientId || acc[patientId]) return acc;
    acc[patientId] = note;
    return acc;
  }, {}), [nursingNotes]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((appointment) => appointment?.status !== 'CANCELLED')
      .filter((appointment) => !appointment?.scheduled_for || new Date(appointment.scheduled_for) >= now)
      .sort((left, right) => new Date(left.scheduled_for) - new Date(right.scheduled_for));
  }, [appointments]);

  const getPatientProgressState = (patientId) => {
    const video = videoByPatientId[patientId] || {};
    const completion = video.scheduledDaysTotal > 0
      ? Math.round((video.scheduledDaysViewed / video.scheduledDaysTotal) * 100)
      : 0;

    if (completion >= 80) {
      return {
        label: 'On track',
        tone: 'text-emerald-700 bg-emerald-500/10',
        bar: 'from-emerald-500 to-emerald-600',
      };
    }

    if (completion >= 50) {
      return {
        label: 'Needs review',
        tone: 'text-amber-700 bg-amber-500/10',
        bar: 'from-amber-500 to-palette-mauve',
      };
    }

    return {
      label: 'Behind',
      tone: 'text-red-700 bg-red-500/10',
      bar: 'from-red-500 to-amber-500',
    };
  };

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
      <section className="glass-panel rounded-[2rem] p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/50">Therapist workspace</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold text-palette-dark">Patient Progress</h1>
          <p className="mt-2 text-palette-dark/70 max-w-2xl">
            See assigned patients, progress from videos, and the latest follow-up notes in one place.
          </p>
        </div>
        <div className="glass-panel rounded-3xl px-4 py-3 text-sm text-palette-dark/70 max-w-sm border border-palette-mauve/15">
          <div className="flex items-center gap-2 font-semibold text-palette-dark">
            <FiUsers /> {patients.length} assigned patients
          </div>
          <p className="mt-1 text-palette-dark/60">Focus on schedule completion, note follow-up, and next appointments.</p>
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
            missedDays: 0,
            pendingDays: 0,
          };
          const patientAssignments = assignmentsByPatientId[patient.patient_id] || [];
          const completion = video.scheduledDaysTotal > 0
            ? Math.round((video.scheduledDaysViewed / video.scheduledDaysTotal) * 100)
            : 0;
          const progressState = getPatientProgressState(patient.patient_id);
          const patientAppointments = upcomingAppointments.filter((appointment) => String(appointment?.patient?.id || appointment?.patient) === patient.patient_id);
          const latestNote = patientNoteMap[patient.patient_id];

          return (
            <div
              key={patient.patient_id}
              className="glass-panel rounded-3xl p-5 text-left border border-palette-mauve/15"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-palette-dark">{patient.patient_name}</h2>
                {!patient.is_active && (
                  <span className="text-xs px-2 py-1 rounded-full bg-palette-beige/70 text-palette-dark/70">Inactive</span>
                )}
              </div>

              {patient.email && <p className="text-sm text-palette-dark/70 mt-1">{patient.email}</p>}

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-white/70 p-2 text-palette-dark/80">Videos: <span className="font-semibold">{video.assignmentsTotal}</span></div>
                <div className="rounded-lg bg-white/70 p-2 text-palette-dark/80">Scheduled: <span className="font-semibold">{video.scheduledAssignments}</span></div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className={`rounded-full px-3 py-1 ${progressState.tone}`}>{progressState.label}</span>
                <span className="rounded-full bg-white/70 px-3 py-1 text-palette-dark/70">
                  {video.scheduledDaysViewed} of {video.scheduledDaysTotal} days viewed
                </span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-palette-dark/70 mb-1">
                  <span>Video Schedule Progress</span>
                  <span>{completion}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-palette-beige">
                  <div
                    className={`h-2.5 rounded-full bg-gradient-to-r ${progressState.bar}`}
                    style={{
                      width: `${completion}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
                <div className="rounded-lg bg-white/70 p-2 text-palette-dark/80">
                  Appointments: <span className="font-semibold">{patientAppointments.length}</span>
                </div>
                <div className="rounded-lg bg-white/70 p-2 text-palette-dark/80">
                  Progress note: <span className="font-semibold">{latestNote ? 'Available' : 'None yet'}</span>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-palette-mauve/15 bg-white/70 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-palette-dark/45">Assigned Videos</p>
                {patientAssignments.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {patientAssignments.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="rounded-xl bg-palette-cream/70 p-3 border border-palette-mauve/10">
                        <p className="text-sm font-semibold text-palette-dark">{assignment.title}</p>
                        <p className="mt-1 text-xs text-palette-dark/60">
                          Assigned to {assignment.patientName} {assignment.assignedAt ? `• ${new Date(assignment.assignedAt).toLocaleDateString()}` : ''}
                        </p>
                        <p className="mt-1 text-xs text-palette-dark/70">
                          Watched {assignment.viewedDays} of {assignment.totalDays || assignment.scheduleDurationDays || 0} scheduled days
                          {assignment.repeatCount > 1 ? ` • Repeat x${assignment.repeatCount}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-palette-dark/60">No video assignments yet.</p>
                )}
              </div>

              <div className="mt-3 rounded-2xl border border-palette-mauve/15 bg-white/70 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-palette-dark/45">Latest follow-up</p>
                {latestNote ? (
                  <>
                    <p className="mt-2 text-sm font-semibold text-palette-dark">
                      {latestNote.nurse_details?.first_name || latestNote.nurse_details?.last_name
                        ? `${latestNote.nurse_details?.first_name || ''} ${latestNote.nurse_details?.last_name || ''}`.trim()
                        : latestNote.nurse_details?.email || 'Nurse'}
                    </p>
                    <p className="mt-1 text-sm text-palette-dark/70 whitespace-pre-wrap">
                      {latestNote.text}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-palette-dark/60">No follow-up note yet.</p>
                )}
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

      <section className="glass-panel rounded-3xl p-5 border border-palette-mauve/15">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-2xl font-bold text-palette-dark">Upcoming Appointments</h2>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-palette-dark/50">
            Therapist schedule
          </span>
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.slice(0, 5).map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-palette-mauve/15 bg-white/70 p-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-palette-dark">{appointment.title}</p>
                    <p className="text-sm text-palette-dark/70">
                      {appointment.patient_details?.first_name} {appointment.patient_details?.last_name}
                    </p>
                    <p className="text-sm text-palette-dark/60">
                      {new Date(appointment.scheduled_for).toLocaleString()} • {appointment.duration_minutes} min
                    </p>
                  </div>
                  <span className="mt-2 md:mt-0 inline-flex rounded-full bg-palette-blush/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-palette-dark/70">
                    {appointment.status}
                  </span>
                </div>
                {appointment.notes && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-palette-dark/70">{appointment.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-palette-dark/70">No appointments scheduled yet.</p>
        )}
      </section>

      {patients.length === 0 && (
        <div className="glass-panel rounded-3xl p-5 border border-palette-mauve/15 text-palette-dark/70">
          No assigned patients found.
        </div>
      )}
    </div>
  );
}
