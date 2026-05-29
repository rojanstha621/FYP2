import { useState, useEffect, useMemo } from 'react';
import { authAPI, assignmentAPI, medicalAPI, nurseAPI } from '../services/api';
import { Card, Button, Select, Textarea } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { Link } from 'react-router-dom';

export const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [nurses, setNurses] = useState([]);
  const [assignmentNurseId, setAssignmentNurseId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [success, setSuccess] = useState('');
  const [nurseAssignments, setNurseAssignments] = useState([]);

  const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
  };

  const getPatientId = (assignment) => String(assignment?.patient?.id || assignment?.patient || '');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const [response, directoryResponse, nurseAssignmentsResponse] = await Promise.all([
        assignmentAPI.getAssignments(),
        authAPI.getCareTeamDirectory(),
        nurseAPI.getAssignments(),
      ]);

      const assignments = extractList(response.data);
      const directory = directoryResponse.data?.result || directoryResponse.data || {};
      setNurses(Array.isArray(directory?.nurses) ? directory.nurses : []);
      setNurseAssignments(extractList(nurseAssignmentsResponse.data));

      const uniquePatients = [];
      const patientIds = new Set();

      assignments.forEach(assignment => {
        const patientId = getPatientId(assignment);
        if (!patientId || patientIds.has(patientId) || !assignment.is_active) {
          return;
        }

        patientIds.add(patientId);
          uniquePatients.push(assignment);
      });

      setPatients(uniquePatients);
    } catch (err) {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const nursesByPatientId = useMemo(() => {
    const map = new Map();
    nurseAssignments
      .filter((assignment) => assignment.is_active !== false)
      .forEach((assignment) => {
        const patientId = String(assignment?.patient?.id || assignment?.patient || '');
        const nurse = assignment.nurse_details;
        if (!patientId) return;
        if (!map.has(patientId)) {
          map.set(patientId, []);
        }
        map.get(patientId).push(nurse);
      });
    return map;
  }, [nurseAssignments]);

  const formatAssignedNurses = (patientId) => {
    const nursesForPatient = nursesByPatientId.get(String(patientId)) || [];
    if (!nursesForPatient.length) return 'No nurse assigned yet';

    return nursesForPatient
      .map((nurse) => `${nurse?.first_name || ''} ${nurse?.last_name || ''}`.trim() || nurse?.email)
      .filter(Boolean)
      .join(', ');
  };

  const handleAssignNurse = async () => {
    if (!selectedPatient?.patient || !assignmentNurseId) return;

    try {
      await nurseAPI.createAssignment({
        nurse: assignmentNurseId,
        patient: selectedPatient.patient,
        note: assignmentNote,
      });
      setAssignmentNurseId('');
      setAssignmentNote('');
      setSuccess('Nurse assigned successfully');
      await fetchPatients();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign nurse');
    }
  };

  const fetchMedicalHistory = async (patientId) => {
    setLoadingHistory(true);
    setMedicalHistory(null);
    try {
      const response = await medicalAPI.getMedicalHistories();
      const histories = response.data.result || response.data || [];
      const patientHistory = histories.find(h => h.patient === patientId);
      setMedicalHistory(patientHistory || null);
    } catch (err) {
      setError('Failed to load medical history');
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-palette-dark">My Patients</h1>
        <Link to="/therapist/pending-requests" className="btn-primary">
          View Pending Requests
        </Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="grid md:grid-cols-2 gap-6">
        {patients.map((assignment) => (
          <Card key={assignment.id} className="cursor-pointer hover:shadow-xl transition-all"
                onClick={() => setSelectedPatient(assignment)}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-palette-dark">
                  {assignment.patient_details.first_name} {assignment.patient_details.last_name}
                </h3>
                <p className="text-palette-dark/70 text-sm">{assignment.patient_details.email}</p>
              </div>
              <span className="px-3 py-1 bg-palette-blush text-palette-dark rounded-full text-sm font-medium">
                Active
              </span>
            </div>

            <p className="text-palette-dark/70 text-sm mb-4">
              Phone: {assignment.patient_details.phone_number || 'Not provided'}
            </p>

            <p className="text-palette-dark/60 text-xs mb-4">
              Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
            </p>

            <p className="text-palette-dark/70 text-sm mb-4">
              Nurse: {formatAssignedNurses(getPatientId(assignment))}
            </p>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="text-sm flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPatient(assignment);
                }}
              >
                View Details →
              </Button>
              <Button
                variant="primary"
                className="text-sm flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchMedicalHistory(assignment.patient);
                  setSelectedPatient(assignment);
                }}
              >
                Medical History
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {patients.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-palette-dark/70 mb-4">No patients assigned yet</p>
          <Link to="/therapist/pending-requests" className="btn-primary inline-block">
            Check Pending Requests
          </Link>
        </Card>
      )}

      {/* Detail Modal */}
      {selectedPatient && !medicalHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPatient(null)}
              className="float-right text-2xl font-bold text-palette-dark/60 hover:text-palette-dark"
            >
              ✕
            </button>

            <h2 className="text-3xl font-bold text-palette-dark mb-6 clear-right">
              {selectedPatient.patient_details.first_name} {selectedPatient.patient_details.last_name}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-palette-dark/80 font-semibold">Email</label>
                <p className="text-palette-dark">{selectedPatient.patient_details.email}</p>
              </div>

              <div>
                <label className="text-sm text-palette-dark/80 font-semibold">Phone</label>
                <p className="text-palette-dark">{selectedPatient.patient_details.phone_number || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm text-palette-dark/80 font-semibold">Member Since</label>
                <p className="text-palette-dark">
                  {new Date(selectedPatient.patient_details.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="text-sm text-palette-dark/80 font-semibold">Assignment Date</label>
                <p className="text-palette-dark">
                  {new Date(selectedPatient.assigned_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="text-sm text-palette-dark/80 font-semibold">Assigned Nurse</label>
                <p className="text-palette-dark">{formatAssignedNurses(selectedPatient.patient)}</p>
              </div>

              <div>
                <label className="text-sm text-palette-dark/80 font-semibold">Assigned Nurse(s)</label>
                <p className="text-palette-dark">{formatAssignedNurses(selectedPatient.patient)}</p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-palette-mauve/20 bg-palette-cream/50 p-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-palette-dark">Assign Nurse</h3>
                <p className="text-sm text-palette-dark/70">
                  Pick a nurse to handle appointments, notes, and other care tasks for this patient.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Select
                  label="Nurse"
                  value={assignmentNurseId}
                  onChange={(e) => setAssignmentNurseId(e.target.value)}
                  className="mb-0"
                >
                  <option value="">Select a nurse</option>
                  {nurses.map((nurse) => (
                    <option key={nurse.id} value={nurse.id}>
                      {nurse.first_name} {nurse.last_name} ({nurse.email})
                    </option>
                  ))}
                </Select>

                <Button
                  type="button"
                  variant="primary"
                  className="w-full md:w-auto md:min-h-[56px] mb-4"
                  onClick={handleAssignNurse}
                  disabled={!assignmentNurseId}
                >
                  Assign Nurse
                </Button>
              </div>

              <Textarea
                label="Note (optional)"
                value={assignmentNote}
                onChange={(e) => setAssignmentNote(e.target.value)}
                placeholder="Add a short instruction for the nurse"
              />
            </div>

            <div className="flex gap-4">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => fetchMedicalHistory(selectedPatient.patient)}
              >
                View Medical History
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedPatient(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Medical History Modal */}
      {selectedPatient && medicalHistory !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="max-w-3xl w-full my-8">
            <button
              onClick={() => {
                setMedicalHistory(null);
                setSelectedPatient(null);
              }}
              className="float-right text-2xl font-bold text-palette-dark/60 hover:text-palette-dark"
            >
              ✕
            </button>

            <h2 className="text-3xl font-bold text-palette-dark mb-2 clear-right">
              Medical History
            </h2>
            <p className="text-palette-dark/70 mb-6">
              {selectedPatient.patient_details.first_name} {selectedPatient.patient_details.last_name}
            </p>

            {loadingHistory ? (
              <div className="text-center py-8">
                <Spinner />
              </div>
            ) : medicalHistory ? (
              <div className="space-y-6">
                <div className="p-4 bg-palette-cream/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-palette-dark mb-2">Past Injuries</h3>
                  <p className="text-palette-dark/70 whitespace-pre-wrap">
                    {medicalHistory.past_injuries || 'No past injuries recorded'}
                  </p>
                </div>

                <div className="p-4 bg-palette-cream/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-palette-dark mb-2">Chronic Conditions</h3>
                  <p className="text-palette-dark/70 whitespace-pre-wrap">
                    {medicalHistory.chronic_conditions || 'No chronic conditions recorded'}
                  </p>
                </div>

                <div className="p-4 bg-palette-cream/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-palette-dark mb-2">Surgeries</h3>
                  <p className="text-palette-dark/70 whitespace-pre-wrap">
                    {medicalHistory.surgeries || 'No surgeries recorded'}
                  </p>
                </div>

                <div className="p-4 bg-palette-cream/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-palette-dark mb-2">Current Medications</h3>
                  <p className="text-palette-dark/70 whitespace-pre-wrap">
                    {medicalHistory.medications || 'No medications recorded'}
                  </p>
                </div>

                <div className="p-4 bg-palette-cream/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-palette-dark mb-2">Allergies</h3>
                  <p className="text-palette-dark/70 whitespace-pre-wrap">
                    {medicalHistory.allergies || 'No allergies recorded'}
                  </p>
                </div>

                <div className="p-4 bg-palette-cream/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-palette-dark mb-2">Current Symptoms</h3>
                  <p className="text-palette-dark/70 whitespace-pre-wrap">
                    {medicalHistory.current_symptoms || 'No symptoms recorded'}
                  </p>
                </div>

                {medicalHistory.medical_report && (
                  <div className="p-4 bg-palette-cream/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-palette-dark mb-2">Medical Report</h3>
                    <a
                      href={medicalHistory.medical_report}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-palette-mauve hover:text-palette-dark underline"
                    >
                      View Report Document
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-palette-dark/70">No medical history found for this patient</p>
              </div>
            )}

            <div className="flex gap-4 pt-6 mt-6 border-t border-palette-mauve/30">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setMedicalHistory(null);
                  setSelectedPatient(null);
                }}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
