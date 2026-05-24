import { useEffect, useMemo, useState } from 'react';
import { assignmentAPI, nurseAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Input, Select, Textarea } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

const emptyForm = {
  nurse: '',
  patient: '',
  therapist: '',
  title: '',
  appointment_type: 'NURSE_CHECKIN',
  scheduled_for: '',
  duration_minutes: 30,
  location: '',
  is_virtual: false,
  notes: '',
};

export const NurseAppointmentsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [therapistAssignments, setTherapistAssignments] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    loadData();
  }, []);

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
      const [appointmentsRes, directoryRes, assignmentsRes, therapistAssignmentRes] = await Promise.all([
        nurseAPI.getAppointments(),
        nurseAPI.getDirectory(),
        nurseAPI.getAssignments(),
        assignmentAPI.getAssignments(),
      ]);

      setAppointments(extractList(appointmentsRes.data));
      const directory = directoryRes.data?.result || directoryRes.data || {};
      setUsers([
        ...(Array.isArray(directory?.nurses) ? directory.nurses : []),
        ...(Array.isArray(directory?.patients) ? directory.patients : []),
        ...(Array.isArray(directory?.therapists) ? directory.therapists : []),
      ]);
      setAssignments(extractList(assignmentsRes.data).filter((assignment) => assignment.is_active !== false));
      setTherapistAssignments(extractList(therapistAssignmentRes.data).filter((assignment) => assignment.is_active !== false));
      setError('');
    } catch (err) {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const assignedPatients = useMemo(() => {
    const assignedPatientIds = new Set(assignments.map((assignment) => assignment.patient));
    const therapistAssignedPatientIds = new Set(therapistAssignments.map((assignment) => assignment.patient));
    return users.filter(
      (user) =>
        user.role === 'PATIENT' &&
        assignedPatientIds.has(user.id) &&
        therapistAssignedPatientIds.has(user.id),
    );
  }, [assignments, therapistAssignments, users]);

  const approvedTherapists = useMemo(
    () => users.filter((user) => user.role === 'THERAPIST' && user.therapist_status === 'APPROVED'),
    [users],
  );

  const availableNurses = useMemo(
    () => users.filter((entry) => entry.role === 'NURSE'),
    [users],
  );

  const therapistByPatientId = useMemo(() => {
    const map = new Map();
    therapistAssignments.forEach((assignment) => {
      const patientId = assignment.patient;
      const therapist = assignment.therapist_details;
      if (!map.has(patientId)) {
        map.set(patientId, []);
      }
      map.get(patientId).push(therapist);
    });
    return map;
  }, [therapistAssignments]);

  const patientsForSelectedTherapist = useMemo(() => {
    if (!formData.therapist) {
      return assignedPatients;
    }

    return assignedPatients.filter((patient) =>
      therapistAssignments.some(
        (assignment) =>
          assignment.patient === patient.id &&
          String(assignment.therapist) === String(formData.therapist) &&
          assignment.is_active !== false,
      ),
    );
  }, [assignedPatients, formData.therapist, therapistAssignments]);

  useEffect(() => {
    if (!formData.patient) return;

    const stillVisible = patientsForSelectedTherapist.some((patient) => patient.id === formData.patient);
    if (!stillVisible) {
      setFormData((current) => ({ ...current, patient: '' }));
    }
  }, [formData.patient, patientsForSelectedTherapist]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    if (isAdmin && !formData.nurse) {
      setError('Select a nurse');
      setSaving(false);
      return;
    }

    try {
      await nurseAPI.createAppointment({
        ...formData,
          nurse: isAdmin ? formData.nurse : undefined,
        duration_minutes: Number(formData.duration_minutes) || 30,
      });
      setSuccess('Appointment created successfully');
      setFormData(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await nurseAPI.cancelAppointment(id);
      setSuccess('Appointment cancelled');
      await loadData();
    } catch (err) {
      setError('Failed to cancel appointment');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      <section className="glass-panel rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/50">Appointments</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold text-palette-dark">Schedule & Manage</h1>
          <p className="mt-2 text-palette-dark/70 max-w-2xl">Create nurse-led appointments, coordinate with therapists, and manage patient schedules.</p>
        </div>
        <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-palette-dark/70 border border-palette-mauve/15">
          {isAdmin ? 'Admin mode: create on behalf of any nurse' : 'Create appointments for your assigned patients'}
        </div>
      </section>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <Card>
        <h2 className="text-2xl font-bold text-palette-dark mb-4">Create Appointment</h2>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          {isAdmin && (
            <Select name="nurse" label="Nurse" value={formData.nurse || ''} onChange={handleChange}>
              <option value="">Select a nurse</option>
              {availableNurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.first_name} {nurse.last_name} ({nurse.email})
                  </option>
              ))}
            </Select>
          )}
          <Select name="patient" label="Patient" value={formData.patient} onChange={handleChange}>
            <option value="">Select a patient</option>
            {patientsForSelectedTherapist.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name} ({patient.email})
                {therapistByPatientId.get(patient.id)?.length
                  ? ` — therapist: ${therapistByPatientId
                      .get(patient.id)
                      .map((therapist) => `${therapist?.first_name || ''} ${therapist?.last_name || ''}`.trim())
                      .filter(Boolean)
                      .join(', ')}`
                  : ' — therapist: not assigned'}
              </option>
            ))}
          </Select>

          <div className="md:col-span-2 text-xs text-palette-dark/60 -mt-2">
            {formData.therapist
              ? 'Patient list is filtered to patients assigned to the selected therapist.'
              : 'Select a therapist to filter patients to only those assigned to that therapist.'}
          </div>

          <Select name="therapist" label="Therapist (optional)" value={formData.therapist} onChange={handleChange}>
            <option value="">No therapist</option>
            {approvedTherapists.map((therapist) => (
              <option key={therapist.id} value={therapist.id}>
                {therapist.first_name} {therapist.last_name} ({therapist.email})
              </option>
            ))}
          </Select>

          <Input name="title" label="Title" value={formData.title} onChange={handleChange} placeholder="Follow-up assessment" />
          <Select name="appointment_type" label="Type" value={formData.appointment_type} onChange={handleChange}>
            <option value="NURSE_CHECKIN">Nurse Check-in</option>
            <option value="THERAPY">Therapy</option>
            <option value="MEDICAL_HISTORY">Medical History</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="OTHER">Other</option>
          </Select>

          <Input
            name="scheduled_for"
            label="Scheduled For"
            type="datetime-local"
            value={formData.scheduled_for}
            onChange={handleChange}
          />
          <Input
            name="duration_minutes"
            label="Duration (minutes)"
            type="number"
            min="1"
            value={formData.duration_minutes}
            onChange={handleChange}
          />

          <Input name="location" label="Location" value={formData.location} onChange={handleChange} placeholder="Room 203 / Telehealth" />
          <label className="flex items-center gap-3 rounded-2xl border border-palette-mauve/20 bg-white/70 px-4 py-3 text-sm text-palette-dark">
            <input
              type="checkbox"
              name="is_virtual"
              checked={formData.is_virtual}
              onChange={handleChange}
              className="h-4 w-4"
            />
            Virtual appointment
          </label>

          <div className="md:col-span-2">
            <Textarea name="notes" label="Notes" value={formData.notes} onChange={handleChange} />
          </div>

          <div className="md:col-span-2 flex gap-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Create Appointment'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4">
        {appointments.map((appointment) => (
          <Card key={appointment.id}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-xl font-bold text-palette-dark">{appointment.title}</h3>
                <p className="text-palette-dark/70 text-sm">
                  {appointment.nurse_details ? `${appointment.nurse_details.first_name} ${appointment.nurse_details.last_name} • ` : ''}
                  {appointment.patient_details?.first_name} {appointment.patient_details?.last_name}
                  {appointment.therapist_details ? ` • ${appointment.therapist_details.first_name} ${appointment.therapist_details.last_name}` : ''}
                </p>
                <p className="text-palette-dark/60 text-sm mt-1">
                  {new Date(appointment.scheduled_for).toLocaleString()} • {appointment.duration_minutes} min
                </p>
                <p className="text-palette-dark/60 text-sm">
                  {appointment.appointment_type} • {appointment.is_virtual ? 'Virtual' : appointment.location || 'No location provided'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-palette-dark border border-palette-mauve/20">
                  {appointment.status}
                </span>
                {appointment.status !== 'CANCELLED' && (
                  <Button variant="danger" onClick={() => handleCancel(appointment.id)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            {appointment.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-palette-dark/70">{appointment.notes}</p>}
          </Card>
        ))}

        {appointments.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-palette-dark/70">No appointments scheduled yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
