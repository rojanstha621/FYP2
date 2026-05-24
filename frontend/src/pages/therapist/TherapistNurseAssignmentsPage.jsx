import { useEffect, useMemo, useState } from 'react';
import { authAPI, nurseAPI } from '../../services/api';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { Button, Card, Select, Textarea } from '../../components/FormElements';

const emptyForm = {
  patient: '',
  nurse: '',
  note: '',
};

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

export default function TherapistNurseAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patients, setPatients] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [directoryRes, assignmentRes] = await Promise.all([
        authAPI.getCareTeamDirectory(),
        nurseAPI.getAssignments(),
      ]);

      const directory = directoryRes.data?.result || directoryRes.data || {};
      const assignmentData = extractList(assignmentRes.data);

      setPatients(Array.isArray(directory?.patients) ? directory.patients : []);
      setNurses(Array.isArray(directory?.nurses) ? directory.nurses : []);
      setAssignments(assignmentData.filter((item) => item.is_active !== false));
      setError('');
    } catch (err) {
      setError('Failed to load nurse assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.is_active !== false),
    [assignments]
  );

  const assignedPatientIds = useMemo(
    () => new Set(activeAssignments.map((assignment) => assignment.patient)),
    [activeAssignments]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.patient || !form.nurse) {
      setError('Select both a patient and a nurse');
      return;
    }

    try {
      await nurseAPI.createAssignment({
        patient: form.patient,
        nurse: form.nurse,
        note: form.note,
      });
      setSuccess('Nurse assigned successfully');
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign nurse');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await nurseAPI.deactivateAssignment(id);
      setSuccess('Nurse assignment deactivated');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate assignment');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      <section className="glass-panel rounded-[2rem] p-6 md:p-8 flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/50">Care coordination</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-palette-dark">Assign a Nurse</h1>
          <p className="mt-2 text-palette-dark/70 max-w-2xl">
            Link a nurse to each assigned patient so the care team can manage notes, vitals, and appointments.
          </p>
        </div>
      </section>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <Select
            label="Patient"
            name="patient"
            value={form.patient}
            onChange={handleChange}
            className="mb-0"
          >
            <option value="">Select a patient</option>
            {patients.map((patient) => (
              <option
                key={patient.id}
                value={patient.id}
                disabled={assignedPatientIds.has(patient.id)}
              >
                {patient.first_name} {patient.last_name} ({patient.email})
                {assignedPatientIds.has(patient.id) ? ' - already assigned' : ''}
              </option>
            ))}
          </Select>

          <Select
            label="Nurse"
            name="nurse"
            value={form.nurse}
            onChange={handleChange}
            className="mb-0"
          >
            <option value="">Select a nurse</option>
            {nurses.map((nurse) => (
              <option key={nurse.id} value={nurse.id}>
                {nurse.first_name} {nurse.last_name} ({nurse.email})
              </option>
            ))}
          </Select>

          <div className="md:col-span-2">
            <Textarea
              label="Note (optional)"
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder="Add a short instruction for the nurse"
              className="mb-0"
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button type="submit" variant="primary">
              Assign Nurse
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setForm(emptyForm)}
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-palette-dark">Active Assignments</h2>
        {activeAssignments.length === 0 ? (
          <Card className="text-center text-palette-dark/70">
            No nurse assignments yet.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeAssignments.map((assignment) => (
              <Card key={assignment.id} className="space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-palette-dark/45">Patient</p>
                  <p className="text-lg font-semibold text-palette-dark">
                    {assignment.patient_details?.first_name} {assignment.patient_details?.last_name}
                  </p>
                  <p className="text-sm text-palette-dark/60">{assignment.patient_details?.email}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-palette-dark/45">Nurse</p>
                  <p className="text-base font-semibold text-palette-dark">
                    {assignment.nurse_details?.first_name} {assignment.nurse_details?.last_name}
                  </p>
                  <p className="text-sm text-palette-dark/60">{assignment.nurse_details?.email}</p>
                </div>

                {assignment.note && (
                  <div className="rounded-2xl bg-palette-cream/60 p-3 text-sm text-palette-dark/70">
                    {assignment.note}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button variant="danger" onClick={() => handleDeactivate(assignment.id)}>
                    Unassign
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
