import { useEffect, useState, useMemo } from 'react';
import { assignmentAPI, medicalAPI, authAPI, nurseAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export default function TherapistPendingRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [requests, setRequests] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [nurseAssignments, setNurseAssignments] = useState([]);
  const [assignmentNurseId, setAssignmentNurseId] = useState('');
  const [assigningFor, setAssigningFor] = useState(null);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;
    return [];
  };

  const fetchRequests = async () => {
    try {
      const [res, directoryRes, nurseAssignmentsRes] = await Promise.all([
        assignmentAPI.getPending({ page_size: 1000 }),
        authAPI.getCareTeamDirectory(),
        nurseAPI.getAssignments(),
      ]);

      setRequests(extractList(res.data));
      const directory = directoryRes.data?.result || directoryRes.data || {};
      setNurses(Array.isArray(directory?.nurses) ? directory.nurses : []);
      const nurseAssignmentData = nurseAssignmentsRes.data?.result || nurseAssignmentsRes.data || [];
      setNurseAssignments(Array.isArray(nurseAssignmentData) ? nurseAssignmentData : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const viewMedicalHistory = async (patientId, patientName) => {
    try {
      const response = await medicalAPI.getMedicalHistories();
      const data = extractList(response.data);
      
      const patientHistory = data.filter(h => h.patient?.id === patientId || h.patient === patientId);
      setMedicalHistory(patientHistory);
      setSelectedPatient(patientName);
      setShowMedicalModal(true);
    } catch (err) {
      setError('Failed to load medical history');
    }
  };

  const nursesByPatientId = useMemo(() => {
    const map = new Map();
    nurseAssignments
      .filter((assignment) => assignment.is_active !== false)
      .forEach((assignment) => {
        const patientId = assignment.patient;
        const nurse = assignment.nurse_details;
        if (!map.has(patientId)) map.set(patientId, []);
        map.get(patientId).push(nurse);
      });
    return map;
  }, [nurseAssignments]);

  const formatAssignedNurses = (patientId) => {
    const nursesForPatient = nursesByPatientId.get(patientId) || [];
    if (!nursesForPatient.length) return 'No nurse assigned yet';

    return nursesForPatient
      .map((nurse) => `${nurse?.first_name || ''} ${nurse?.last_name || ''}`.trim() || nurse?.email)
      .filter(Boolean)
      .join(', ');
  };

  const handleAssignNurse = async (patientId) => {
    if (!assignmentNurseId || !patientId) return;
    setAssigningFor(patientId);
    try {
      await nurseAPI.createAssignment({ nurse: assignmentNurseId, patient: patientId });
      setAssignmentNurseId('');
      setSuccess('Nurse assigned successfully');
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign nurse');
    } finally {
      setAssigningFor(null);
    }
  };

  const handleUnassign = async (patientId, nurseId) => {
    try {
      // find the active assignment id for this patient+nurse
      const match = nurseAssignments.find(a => a.patient === patientId && a.nurse === nurseId && a.is_active !== false);
      if (!match) return setError('No active assignment found to remove');
      await nurseAPI.deactivateAssignment(match.id);
      setSuccess('Nurse unassigned successfully');
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign nurse');
    }
  };

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      const response = await assignmentAPI.activateAssignment(id);
      setSuccess(response.data?.message || 'Request approved successfully');
      setError(null);
      setConfirmAction(null);
      fetchRequests();
    } catch (err) {
      console.error('Approve error:', err.response?.data);
      const errorMsg = err.response?.data?.message 
        || err.response?.data?.error 
        || err.message 
        || 'Failed to approve request';
      setError(errorMsg);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (id) => {
    setRejecting(id);
    try {
      const response = await assignmentAPI.rejectAssignment(id);
      setSuccess(response.data?.message || 'Request rejected successfully');
      setError(null);
      setConfirmAction(null);
      fetchRequests();
    } catch (err) {
      console.error('Reject error:', err.response?.data);
      const errorMsg = err.response?.data?.message 
        || err.response?.data?.error 
        || err.message 
        || 'Failed to reject request';
      setError(errorMsg);
    } finally {
      setRejecting(null);
    }
  };

  return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <section className="glass-panel rounded-[2rem] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/50">Therapist workspace</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-palette-dark">Pending Patient Requests</h1>
          <p className="mt-2 text-palette-dark/70">Review and respond to new patient assignment requests.</p>
        </section>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        {loading ? (
          <Spinner />
        ) : (
          <div className="glass-panel rounded-3xl border border-palette-mauve/15 divide-y">
            {requests.length ? (
              requests.map((r) => (
                <div key={r.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-palette-mauve to-[#6f4c60] flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-semibold text-white">
                            {r.patient_details?.first_name?.[0]}{r.patient_details?.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-lg text-palette-dark">
                            {r.patient_details?.first_name} {r.patient_details?.last_name}
                          </div>
                          <div className="text-sm text-palette-dark/70">{r.patient_details?.email}</div>
                        </div>
                      </div>
                      
                      {r.patient_details?.phone_number && (
                        <div className="text-sm text-palette-dark/70 ml-15">
                          <span className="font-medium">Phone:</span> {r.patient_details.phone_number}
                        </div>
                      )}

                      {r.created_at && (
                        <div className="text-xs text-palette-dark/50 ml-15 mt-2">
                          Requested on {new Date(r.created_at).toLocaleDateString()} at {new Date(r.created_at).toLocaleTimeString()}
                        </div>
                      )}
                      
                      <div className="mt-3 text-sm">
                        <span className="font-medium">Assigned Nurse:</span>
                        <div className="text-palette-dark/70">{formatAssignedNurses(r.patient_details?.id || r.patient)}</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => viewMedicalHistory(
                          r.patient_details?.id || r.patient,
                          `${r.patient_details?.first_name} ${r.patient_details?.last_name}`
                        )}
                        className="btn-secondary text-sm whitespace-nowrap"
                      >
                        View Medical History
                      </button>
                      <button
                        onClick={() => setConfirmAction({ 
                          type: 'approve', 
                          id: r.id, 
                          patientName: `${r.patient_details?.first_name} ${r.patient_details?.last_name}` 
                        })}
                        disabled={approving === r.id}
                        className="btn-primary text-sm whitespace-nowrap"
                      >
                        {approving === r.id ? 'Accepting...' : 'Accept Request'}
                      </button>
                      <button
                        onClick={() => setConfirmAction({ 
                          type: 'reject', 
                          id: r.id, 
                          patientName: `${r.patient_details?.first_name} ${r.patient_details?.last_name}` 
                        })}
                        disabled={rejecting === r.id}
                        className="btn-danger text-sm whitespace-nowrap"
                      >
                        {rejecting === r.id ? 'Rejecting...' : 'Reject Request'}
                      </button>
                      
                      <div className="mt-2 flex flex-col gap-2">
                        <div className="text-sm text-palette-dark/80">Edit Nurse Assignment</div>
                        <div className="flex gap-2">
                          <select
                            value={assignmentNurseId}
                            onChange={(e) => setAssignmentNurseId(e.target.value)}
                            className="border border-palette-mauve/30 rounded-xl px-3 py-2 text-sm bg-white/70 text-palette-dark"
                          >
                            <option value="">Select a nurse</option>
                            {nurses.map((n) => (
                              <option key={n.id} value={n.id}>{n.first_name} {n.last_name} ({n.email})</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignNurse(r.patient_details?.id || r.patient)}
                            disabled={assigningFor === (r.patient_details?.id || r.patient) || !assignmentNurseId}
                            className="btn-primary text-sm disabled:opacity-60"
                          >
                            {assigningFor === (r.patient_details?.id || r.patient) ? 'Assigning...' : 'Assign'}
                          </button>
                        </div>

                        {/* show individual assigned nurses with unassign buttons */}
                        { (nursesByPatientId.get(r.patient_details?.id || r.patient) || []).map((n) => (
                          <div key={n.id} className="flex items-center gap-2 text-sm">
                            <div className="text-palette-dark/70">{n.first_name} {n.last_name} ({n.email})</div>
                            <button
                              onClick={() => handleUnassign(r.patient_details?.id || r.patient, n.id)}
                              className="text-sm text-red-600 hover:underline"
                            >
                              Unassign
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-palette-dark/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-lg text-palette-dark/60">No pending requests</p>
                <p className="mt-2 text-sm text-palette-dark/50">When patients request to work with you, they will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="glass-panel rounded-3xl p-6 max-w-md w-full mx-4 border border-palette-mauve/15">
              <h3 className="text-lg font-semibold mb-4">
                {confirmAction.type === 'approve' ? 'Confirm Acceptance' : 'Confirm Rejection'}
              </h3>
              <p className="text-palette-dark/70 mb-6">
                {confirmAction.type === 'approve' 
                  ? `Are you sure you want to accept ${confirmAction.patientName} as your patient? You will be able to manage their video program and track their progress.`
                  : `Are you sure you want to reject the request from ${confirmAction.patientName}? This action cannot be undone.`
                }
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmAction.type === 'approve' ? handleApprove(confirmAction.id) : handleReject(confirmAction.id)}
                  className={confirmAction.type === 'approve' ? 'btn-primary' : 'btn-danger'}
                >
                  {confirmAction.type === 'approve' ? 'Accept' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Medical History Modal */}
        {showMedicalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="glass-panel rounded-3xl p-6 max-w-3xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto border border-palette-mauve/15">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Medical History - {selectedPatient}</h3>
                <button
                  onClick={() => {
                    setShowMedicalModal(false);
                    setMedicalHistory(null);
                    setSelectedPatient(null);
                  }}
                  className="text-palette-dark/50 hover:text-palette-dark/70 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              
              {medicalHistory && medicalHistory.length > 0 ? (
                <div className="space-y-4">
                  {medicalHistory.map((history) => (
                    <div key={history.id} className="border border-palette-mauve/20 rounded-2xl p-4 bg-white/70">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-semibold">Condition:</span>
                          <p className="text-palette-dark/80">{history.diagnosis || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Height:</span>
                          <p className="text-palette-dark/80">{history.height ? `${history.height} cm` : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Weight:</span>
                          <p className="text-palette-dark/80">{history.weight ? `${history.weight} kg` : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Blood Pressure:</span>
                          <p className="text-palette-dark/80">{history.blood_pressure || 'N/A'}</p>
                        </div>
                        {history.allergies && (
                          <div className="col-span-2">
                            <span className="font-semibold">Allergies:</span>
                            <p className="text-palette-dark/80">{history.allergies}</p>
                          </div>
                        )}
                        {history.current_medications && (
                          <div className="col-span-2">
                            <span className="font-semibold">Current Medications:</span>
                            <p className="text-palette-dark/80">{history.current_medications}</p>
                          </div>
                        )}
                        {history.notes && (
                          <div className="col-span-2">
                            <span className="font-semibold">Notes:</span>
                            <p className="text-palette-dark/80">{history.notes}</p>
                          </div>
                        )}
                        <div className="col-span-2 text-xs text-palette-dark/60">
                          Updated: {new Date(history.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-palette-dark/60 text-center py-8">No medical history available for this patient</p>
              )}
            </div>
          </div>
        )}
      </div>
  );
}
