import { useState, useEffect } from 'react';
import { assignmentAPI } from '../services/api';
import { Card, Button, Select, Textarea } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAssignForm, setShowAssignForm] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await assignmentAPI.getAssignments();
      const uniquePatients = [];
      const patientIds = new Set();

      response.data.result.forEach(assignment => {
        if (!patientIds.has(assignment.patient) && assignment.is_active) {
          patientIds.add(assignment.patient);
          uniquePatients.push(assignment);
        }
      });

      setPatients(uniquePatients);
    } catch (err) {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-palette-dark">My Patients</h1>
        <Button variant="primary" onClick={() => setShowAssignForm(true)}>
          Assign New Patient
        </Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

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

            <Button variant="ghost" className="text-sm" onClick={() => setSelectedPatient(assignment)}>
              View Details →
            </Button>
          </Card>
        ))}
      </div>

      {patients.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-palette-dark/70 mb-4">No patients assigned yet</p>
          <Button variant="primary" onClick={() => setShowAssignForm(true)}>
            Assign Your First Patient
          </Button>
        </Card>
      )}

      {selectedPatient && (
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
            </div>

            <div className="flex gap-4">
              <Button variant="primary" className="flex-1">
                Create Exercise Plan
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedPatient(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
