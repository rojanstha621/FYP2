import { useState, useEffect } from 'react';
import { assignmentAPI, adminAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Select } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export const AssignmentsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    therapist: '',
    patient: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const requests = [assignmentAPI.getAssignments()];

      // Only admins need the full user list to create assignments
      if (user?.role === 'ADMIN') {
        requests.push(adminAPI.getUsers());
      }

      const [assignmentsRes, usersRes] = await Promise.all(requests);

      const assignmentData = assignmentsRes.data.result || assignmentsRes.data || [];

      // Admin sees all, therapists see only their assignments
      const visibleAssignments = user?.role === 'THERAPIST'
        ? assignmentData.filter(a => a.therapist === user.id)
        : assignmentData;

      setAssignments(visibleAssignments);

      if (usersRes) {
        const userList = usersRes.data.result || usersRes.data || [];
        setPatients(userList.filter(u => u.role === 'PATIENT'));
        setTherapists(userList.filter(u => u.role === 'THERAPIST'));
      }
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

    if (!formData.patient || !formData.therapist) {
      setError('Please select both therapist and patient');
      return;
    }

    try {
      await assignmentAPI.createAssignment({
        therapist: formData.therapist,
        patient: formData.patient,
      });
      setSuccess('Patient assigned successfully');
      setShowForm(false);
      setFormData({ therapist: '', patient: '' });
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
        {user?.role === 'ADMIN' && (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Assign New Patient
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {showForm && user?.role === 'ADMIN' && (
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-palette-dark mb-6">Assign New Patient</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Select Therapist"
              name="therapist"
              value={formData.therapist}
              onChange={handleChange}
            >
              <option value="">-- Choose a therapist --</option>
              {therapists.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.email})
                </option>
              ))}
            </Select>

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
                <p className="text-palette-dark/60 text-sm">
                  Therapist: {assignment.therapist_details?.first_name} {assignment.therapist_details?.last_name}
                </p>
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

            {user?.role === 'ADMIN' && (
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
            )}
          </Card>
        ))}
      </div>

      {assignments.length === 0 && (!showForm || user?.role !== 'ADMIN') && (
        <Card className="text-center py-12">
          <p className="text-palette-dark/70 mb-4">No patient assignments yet</p>
          {user?.role === 'ADMIN' && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Assign Your First Patient
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};
