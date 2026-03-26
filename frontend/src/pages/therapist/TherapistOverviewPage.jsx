import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { getDailyProgress, getTherapistOverview } from '../../api/progressApi';

const toDateInput = (date) => date.toISOString().slice(0, 10);

export default function TherapistOverviewPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dailyProgress, setDailyProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [error, setError] = useState('');
  const [dailyError, setDailyError] = useState('');
  const [date, setDate] = useState(toDateInput(new Date()));

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
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadDailyProgress(selectedPatientId, date);
    }
  }, [selectedPatientId, date]);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-palette-dark">Therapist Overview</h1>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {patients.map((patient) => (
            <button
              type="button"
              key={patient.patient_id}
              onClick={() => setSelectedPatient(patient)}
              className={`w-full rounded-lg p-4 text-left shadow-sm transition ${
                selectedPatientId === patient.patient_id
                  ? 'bg-palette-mauve/20 border border-palette-mauve'
                  : 'bg-palette-cream hover:shadow-md'
              }`}
            >
              <h2 className="text-lg font-semibold text-palette-dark">{patient.patient_name}</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-palette-dark/80">
                <p>Total Sessions: {patient.total_sessions_all_time}</p>
                <p>Completed: {patient.completed_all_time}</p>
                <p>Streak: {patient.current_streak}</p>
                <p>
                  Last Session:{' '}
                  {patient.last_session_date
                    ? new Date(patient.last_session_date).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-lg bg-palette-cream p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-palette-dark">
              {selectedPatient ? `${selectedPatient.patient_name} Daily Progress` : 'Daily Progress'}
            </h2>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-palette-mauve/30 px-3 py-2"
            />
          </div>

          {dailyLoading ? (
            <Spinner />
          ) : dailyError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{dailyError}</div>
          ) : dailyProgress ? (
            <div>
              <p className="mb-2 text-sm text-palette-dark/80">
                Completed {dailyProgress.completed_sessions} / {dailyProgress.total_sessions} sessions
              </p>
              <div className="h-3 w-full rounded-full bg-palette-beige">
                <div
                  className="h-3 rounded-full bg-blue-600"
                  style={{ width: `${dailyProgress.completion_percentage || 0}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-palette-dark/80">
                Total Duration: {Math.round((dailyProgress.total_duration_seconds || 0) / 60)} minutes
              </p>
            </div>
          ) : (
            <p className="text-sm text-palette-dark/70">Select a patient to see daily progress.</p>
          )}
        </div>
      </div>
    </div>
  );
}
