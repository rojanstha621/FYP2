import { useEffect, useMemo, useState } from 'react';
import { assignmentAPI, medicalAPI, nurseAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Select, Textarea } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

const emptyHistory = {
  past_injuries: '',
  chronic_conditions: '',
  surgeries: '',
  medications: '',
  allergies: '',
  current_symptoms: '',
};

export const NursePatientsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [therapistAssignments, setTherapistAssignments] = useState([]);
  const [histories, setHistories] = useState([]);
  const [assignmentPatientId, setAssignmentPatientId] = useState('');
  const [assignmentNurseId, setAssignmentNurseId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [historyForm, setHistoryForm] = useState(emptyHistory);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);
  const [showAllAssignments, setShowAllAssignments] = useState(false);
  const [showAllPatients, setShowAllPatients] = useState(false);

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
      const [assignmentRes, directoryRes, historyRes, therapistAssignmentRes] = await Promise.all([
        nurseAPI.getAssignments(),
        nurseAPI.getDirectory(),
        medicalAPI.getMedicalHistories(),
        assignmentAPI.getAssignments(),
      ]);

      const assignmentData = extractList(assignmentRes.data);
      const directory = directoryRes.data?.result || directoryRes.data || {};
      const therapistAssignmentData = extractList(therapistAssignmentRes.data);

      setAssignments(assignmentData.filter((item) => item.is_active !== false));
      setPatients(Array.isArray(directory?.patients) ? directory.patients : []);
      setNurses(Array.isArray(directory?.nurses) ? directory.nurses : []);
      setTherapistAssignments(therapistAssignmentData.filter((item) => item.is_active !== false));
      setHistories(extractList(historyRes.data));
      setError('');
    } catch (err) {
      setError('Failed to load nurse patient data');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId],
  );

  const activePatientIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.patient)),
    [assignments],
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

  const therapistAssignedPatientIds = useMemo(
    () => new Set(therapistAssignments.map((assignment) => assignment.patient)),
    [therapistAssignments],
  );

  const visiblePatientsForNurse = useMemo(() => {
    if (isAdmin) return patients;
    return patients.filter((patient) => therapistAssignedPatientIds.has(patient.id));
  }, [isAdmin, patients, therapistAssignedPatientIds]);

  const visibleAssignments = useMemo(
    () => (showAllAssignments ? assignments : assignments.slice(0, 5)),
    [assignments, showAllAssignments],
  );

  const visiblePatients = useMemo(
    () => (showAllPatients ? visiblePatientsForNurse : visiblePatientsForNurse.slice(0, 5)),
    [showAllPatients, visiblePatientsForNurse],
  );

  const refreshHistoryForm = (history) => {
    setEditingHistoryId(history?.id || null);
    setHistoryForm({
      past_injuries: history?.past_injuries || '',
      chronic_conditions: history?.chronic_conditions || '',
      surgeries: history?.surgeries || '',
      medications: history?.medications || '',
      allergies: history?.allergies || '',
      current_symptoms: history?.current_symptoms || '',
    });
  };

  const openHistoryEditor = (patientId) => {
    const history = histories.find((item) => item.patient === patientId);
    setSelectedPatientId(patientId);
    refreshHistoryForm(history);
    setShowHistoryModal(true);
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    setError('');

    if (!assignmentPatientId) {
      setError('Select a patient to assign');
      return;
    }

    if (isAdmin && !assignmentNurseId) {
      setError('Select a nurse to assign');
      return;
    }

    try {
      await nurseAPI.createAssignment(
        isAdmin
          ? { nurse: assignmentNurseId, patient: assignmentPatientId }
          : { patient: assignmentPatientId },
      );
      setSuccess('Patient assigned to nurse successfully');
      setAssignmentPatientId('');
      setAssignmentNurseId('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign patient');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await nurseAPI.deactivateAssignment(id);
      setSuccess('Nurse assignment deactivated');
      await loadData();
    } catch (err) {
      setError('Failed to deactivate assignment');
    }
  };

  const handleHistorySubmit = async (event) => {
    event.preventDefault();
    setSavingHistory(true);
    setError('');

    try {
      if (editingHistoryId) {
        await medicalAPI.updateMedicalHistory(editingHistoryId, {
          patient: selectedPatientId,
          ...historyForm,
        });
        setSuccess('Medical history updated successfully');
      } else {
        await medicalAPI.createMedicalHistory({
          patient: selectedPatientId,
          ...historyForm,
        });
        setSuccess('Medical history created successfully');
      }

      setShowHistoryModal(false);
      refreshHistoryForm(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medical history');
    } finally {
      setSavingHistory(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      <section className="glass-panel rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/50">Nurse tools</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold text-palette-dark">Patients & Medical Histories</h1>
          <p className="mt-2 text-palette-dark/70 max-w-2xl">Assign patients, create or update medical histories, and coordinate care with therapists.</p>
        </div>
        <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-palette-dark/70 border border-palette-mauve/15">
          {isAdmin ? 'Admin: manage any nurse assignment' : 'Manage assigned patients and histories'}
        </div>
      </section>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-palette-dark/45">Patient assignment</p>
            <h2 className="mt-2 text-2xl font-bold text-palette-dark">Assign a Patient</h2>
            <p className="mt-2 text-sm text-palette-dark/70 max-w-2xl">
              Assign a patient to a nurse so the care team can manage histories, notes, and appointments in one place.
            </p>
          </div>
          <div className="rounded-2xl bg-palette-blush/25 px-4 py-3 text-sm text-palette-dark/70">
            {isAdmin ? 'Admin: choose the nurse and patient' : 'Nurse: choose an assigned patient'}
          </div>
        </div>

        <form onSubmit={handleAssign} className="mt-6 grid gap-4 lg:grid-cols-2">
          {isAdmin && (
            <Select
              label="Nurse"
              value={assignmentNurseId}
              onChange={(event) => setAssignmentNurseId(event.target.value)}
              className="mb-0"
            >
              <option value="">Select a nurse</option>
              {nurses.map((nurse) => (
                <option key={nurse.id} value={nurse.id}>
                  {nurse.first_name} {nurse.last_name} ({nurse.email})
                </option>
              ))}
            </Select>
          )}

          <Select
            label="Patient"
            value={assignmentPatientId}
            onChange={(event) => setAssignmentPatientId(event.target.value)}
            className="mb-0"
          >
            <option value="">Select a patient</option>
            {visiblePatientsForNurse.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name} ({patient.email})
              </option>
            ))}
          </Select>

          <div className="lg:col-span-2 flex justify-end pt-2">
            <Button type="submit" variant="primary">Assign Patient</Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-bold text-palette-dark mb-4">Assigned Patients</h2>
          <p className="mb-3 text-sm text-palette-dark/60">
            Showing {visibleAssignments.length} of {assignments.length} assigned patients.
          </p>
          <div className="space-y-4">
            {visibleAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded-2xl border border-palette-mauve/20 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {isAdmin && assignment.nurse_details && (
                      <p className="text-xs text-palette-dark/60 mb-1">
                        Nurse: {assignment.nurse_details.first_name} {assignment.nurse_details.last_name}
                      </p>
                    )}
                    <p className="font-semibold text-palette-dark">
                      {assignment.patient_details?.first_name} {assignment.patient_details?.last_name}
                    </p>
                    <p className="text-sm text-palette-dark/70">{assignment.patient_details?.email}</p>
                    <p className="text-xs text-palette-dark/60 mt-1">
                      Therapist:{' '}
                      {therapistByPatientId.get(assignment.patient)?.length
                        ? therapistByPatientId
                            .get(assignment.patient)
                            .map((therapist) => `${therapist?.first_name || ''} ${therapist?.last_name || ''}`.trim())
                            .filter(Boolean)
                            .join(', ')
                        : 'Not assigned'}
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => handleDeactivate(assignment.id)}>
                    Deactivate
                  </Button>
                </div>
              </div>
            ))}
            {assignments.length === 0 && <p className="text-palette-dark/70">No patients assigned yet.</p>}
            {assignments.length > 5 && (
              <Button variant="ghost" onClick={() => setShowAllAssignments((value) => !value)}>
                {showAllAssignments ? 'Show fewer' : `Show all ${assignments.length}`}
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-palette-dark mb-4">Medical Histories</h2>
          <p className="mb-3 text-sm text-palette-dark/60">
            Showing {visiblePatients.length} of {patients.length} patients with their history status.
          </p>
          <div className="space-y-4">
            {visiblePatients.map((patient) => {
              const history = histories.find((item) => item.patient === patient.id);
              const isAssigned = activePatientIds.has(patient.id);

              return (
                <div key={patient.id} className="rounded-2xl border border-palette-mauve/20 bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-palette-dark">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-sm text-palette-dark/70">{patient.email}</p>
                      <p className="text-xs text-palette-dark/60 mt-1">
                        {history ? 'Medical history exists' : 'No medical history yet'}
                      </p>
                      <p className="text-xs text-palette-dark/60 mt-1">
                        Therapist:{' '}
                        {therapistByPatientId.get(patient.id)?.length
                          ? therapistByPatientId
                              .get(patient.id)
                              .map((therapist) => `${therapist?.first_name || ''} ${therapist?.last_name || ''}`.trim())
                              .filter(Boolean)
                              .join(', ')
                          : 'Not assigned'}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => openHistoryEditor(patient.id)}
                      disabled={!isAssigned}
                    >
                      {history ? 'Edit' : 'Create'}
                    </Button>
                  </div>
                  {!isAssigned && (
                    <p className="mt-2 text-xs text-palette-dark/60">
                      Assign this patient first to manage their medical history.
                    </p>
                  )}
                </div>
              );
            })}
            {visiblePatientsForNurse.length === 0 && <p className="text-palette-dark/70">No therapist-assigned patients found.</p>}
            {visiblePatientsForNurse.length > 5 && (
              <Button variant="ghost" onClick={() => setShowAllPatients((value) => !value)}>
                {showAllPatients ? 'Show fewer' : `Show all ${visiblePatientsForNurse.length}`}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {showHistoryModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <Card className="max-w-3xl w-full my-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-palette-dark">Medical History</h2>
                <p className="text-palette-dark/70">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setShowHistoryModal(false)}>Close</Button>
            </div>

            <form onSubmit={handleHistorySubmit} className="space-y-4">
              <Textarea name="past_injuries" label="Past Injuries" value={historyForm.past_injuries} onChange={(e) => setHistoryForm({ ...historyForm, past_injuries: e.target.value })} style={{ minHeight: '40px', height: '40px' }} />
              <Textarea name="chronic_conditions" label="Chronic Conditions" value={historyForm.chronic_conditions} onChange={(e) => setHistoryForm({ ...historyForm, chronic_conditions: e.target.value })} style={{ minHeight: '40px', height: '40px' }} />
              <Textarea name="surgeries" label="Surgeries" value={historyForm.surgeries} onChange={(e) => setHistoryForm({ ...historyForm, surgeries: e.target.value })} style={{ minHeight: '40px', height: '40px' }} />
              <Textarea name="medications" label="Medications" value={historyForm.medications} onChange={(e) => setHistoryForm({ ...historyForm, medications: e.target.value })} style={{ minHeight: '40px', height: '40px' }} />
              <Textarea name="allergies" label="Allergies" value={historyForm.allergies} onChange={(e) => setHistoryForm({ ...historyForm, allergies: e.target.value })} style={{ minHeight: '40px', height: '40px' }} />
              <Textarea name="current_symptoms" label="Current Symptoms" value={historyForm.current_symptoms} onChange={(e) => setHistoryForm({ ...historyForm, current_symptoms: e.target.value })} style={{ minHeight: '40px', height: '40px' }} />

              <div className="flex gap-4 pt-4">
                <Button type="submit" variant="primary" className="flex-1" disabled={savingHistory}>
                  {savingHistory ? 'Saving...' : 'Save Medical History'}
                </Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowHistoryModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
