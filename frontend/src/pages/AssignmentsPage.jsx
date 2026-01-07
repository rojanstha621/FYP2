import { useState, useEffect } from 'react';
import { assignmentAPI, adminAPI } from '../services/api';
import { Card, Button, Select, Textarea, Input } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export const AssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    patient: '',
    title: '',
    description: '',
    duration: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, usersRes] = await Promise.all([
        assignmentAPI.getAssignments(),
        adminAPI.getUsers(),
      ]);

      setAssignments(assignmentsRes.data.result);
      
      // Filter to show only patients
      const patients = usersRes.data.result.filter(u => u.role === 'PATIENT');
      setUsers(patients);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.patient) {
      setError('Please select a patient');
      return;
    }

    try {
      await assignmentAPI.createAssignment({
        patient: formData.patient,
      });
      setSuccess('Patient assigned successfully');
      setShowForm(false);
      setFormData({ patient: '', title: '', description: '', duration: '' });
      await fetchData();
    } catch (err) {
      setError('Failed to create assignment');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await assignmentAPI.updateAssignment(id, { is_active: false });
      setSuccess('Assignment deactivated');
      await fetchData();
    } catch (err) {
      setError('Failed to deactivate assignment');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-palette-dark">Patient Assignments</h1>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          Assign New Patient
        </Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {showForm && (
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-palette-dark mb-6">Assign New Patient</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Select Patient"
              name="patient"
              value={formData.patient}
              onChange={handleChange}
            >
              <option value="">-- Choose a patient --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.email})
                </option>
              ))}
            </Select>

            <div className="flex gap-4">
              <Button type="submit" variant="primary">
                Assign Patient
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-palette-dark">
                  {assignment.patient_details.first_name} {assignment.patient_details.last_name}
                </h3>
                <p className="text-palette-dark/60 text-sm">{assignment.patient_details.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                assignment.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-palette-cream text-palette-dark'
              }`}>
                {assignment.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <p className="text-palette-dark/50 text-sm mb-4">
              Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
            </p>

            <div className="flex gap-4">
              <Button variant="primary" className="flex-1">
                Create Exercise Plan
              </Button>
              {assignment.is_active && (
                <Button 
                  variant="danger"
                  onClick={() => handleDeactivate(assignment.id)}
                >
                  Deactivate
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {assignments.length === 0 && !showForm && (
        <Card className="text-center py-12">
          <p className="text-palette-dark/70 mb-4">No patient assignments yet</p>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Assign Your First Patient
          </Button>
        </Card>
      )}
    </div>
  );
};
