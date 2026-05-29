import { useState, useEffect } from 'react';
import { medicalAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Textarea } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export const MedicalHistoryPage = () => {
  const { user } = useAuth();
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    past_injuries: '',
    chronic_conditions: '',
    surgeries: '',
    medications: '',
    allergies: '',
    current_symptoms: '',
  });

  useEffect(() => {
    fetchMedicalHistory();
  }, []);

  const fetchMedicalHistory = async () => {
    try {
      const response = await medicalAPI.getMedicalHistories();
      const histories = response.data.result || response.data || [];
      if (histories.length > 0) {
        setMedicalHistory(histories[0]);
        setFormData(histories[0]);
      }
    } catch (err) {
      setError('Failed to load medical history');
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

    try {
      const userId = user?.id;
      const submitData = {
        ...formData,
        patient: userId,
      };

      if (medicalHistory?.id) {
        await medicalAPI.updateMedicalHistory(medicalHistory.id, submitData);
        setSuccess('Medical history updated successfully');
      } else {
        const response = await medicalAPI.createMedicalHistory(submitData);
        setMedicalHistory(response.data.result);
        setSuccess('Medical history created successfully');
      }
      setShowEditModal(false);
      await fetchMedicalHistory();
    } catch (err) {
      console.error('Error saving medical history:', err);
      setError(err.response?.data?.patient?.[0] || 'Failed to save medical history');
    }
  };

  if (loading) return <Spinner />;

  const medicalSections = [
    {
      key: 'past_injuries',
      label: 'Past Injuries',
      color: 'border-palette-mauve/30',
      value: medicalHistory?.past_injuries || 'No past injuries recorded',
    },
    {
      key: 'chronic_conditions',
      label: 'Chronic Conditions',
      color: 'border-palette-blush/40',
      value: medicalHistory?.chronic_conditions || 'No chronic conditions recorded',
    },
    {
      key: 'surgeries',
      label: 'Surgeries',
      color: 'border-palette-beige/60',
      value: medicalHistory?.surgeries || 'No surgeries recorded',
    },
    {
      key: 'medications',
      label: 'Current Medications',
      color: 'border-palette-mauve/30',
      value: medicalHistory?.medications || 'No medications recorded',
    },
    {
      key: 'allergies',
      label: 'Allergies',
      color: 'border-palette-blush/40',
      value: medicalHistory?.allergies || 'No allergies recorded',
    },
    {
      key: 'current_symptoms',
      label: 'Current Symptoms',
      color: 'border-palette-mauve/30',
      value: medicalHistory?.current_symptoms || 'No symptoms recorded',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="glass-panel rounded-[2rem] p-6 md:p-8 mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-palette-dark mb-2">Medical History</h1>
          <p className="text-palette-dark/70">Complete overview of your medical background</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setShowEditModal(true);
            setError('');
          }}
        >
          Edit Medical History
        </Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {!medicalHistory ? (
        <Card className="text-center py-12">
          <p className="text-palette-dark/60 mb-6">No medical history recorded yet</p>
          <Button variant="primary" onClick={() => setShowEditModal(true)}>
            Create Medical History
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {medicalSections.map((section) => (
            <Card key={section.key} className={`${section.color} border-l-4`}>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-palette-dark mb-2">{section.label}</h3>
                <p className="text-palette-dark/60 text-sm whitespace-pre-wrap">
                  {section.value}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditModal(false)}
              className="float-right text-2xl font-bold text-palette-dark/60 hover:text-palette-dark mb-4"
            >
              ×
            </button>

            <h2 className="text-3xl font-bold text-palette-dark mb-6 clear-right">
              Edit Medical History
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Past Injuries */}
              <div>
                <label className="text-sm text-palette-dark/80 font-semibold mb-2">
                  Past Injuries
                </label>
                <Textarea
                  name="past_injuries"
                  placeholder="Describe any past injuries (e.g., broken bones, sprains, etc.)"
                  value={formData.past_injuries || ''}
                  onChange={handleChange}
                  style={{ minHeight: '40px', height: '40px' }}
                />
              </div>

              {/* Chronic Conditions */}
              <div>
                <label className="text-sm text-palette-dark/80 font-semibold mb-2">
                  Chronic Conditions
                </label>
                <Textarea
                  name="chronic_conditions"
                  placeholder="List any chronic conditions (e.g., diabetes, arthritis, etc.)"
                  value={formData.chronic_conditions || ''}
                  onChange={handleChange}
                  style={{ minHeight: '40px', height: '40px' }}
                />
              </div>

              {/* Surgeries */}
              <div>
                <label className="text-sm text-palette-dark/80 font-semibold mb-2">
                  Surgeries
                </label>
                <Textarea
                  name="surgeries"
                  placeholder="Describe any surgeries you've had (e.g., knee surgery, cardiac surgery, etc.)"
                  value={formData.surgeries || ''}
                  onChange={handleChange}
                  style={{ minHeight: '40px', height: '40px' }}
                />
              </div>

              {/* Medications */}
              <div>
                <label className="text-sm text-palette-dark/80 font-semibold mb-2">
                  Current Medications
                </label>
                <Textarea
                  name="medications"
                  placeholder="List all current medications with dosages (e.g., Aspirin 100mg daily)"
                  value={formData.medications || ''}
                  onChange={handleChange}
                  style={{ minHeight: '40px', height: '40px' }}
                />
              </div>

              {/* Allergies */}
              <div>
                <label className="text-sm text-palette-dark/80 font-semibold mb-2">
                  Allergies
                </label>
                <Textarea
                  name="allergies"
                  placeholder="List any allergies (e.g., penicillin, peanuts, etc.)"
                  value={formData.allergies || ''}
                  onChange={handleChange}
                  style={{ minHeight: '40px', height: '40px' }}
                />
              </div>

              {/* Current Symptoms */}
              <div>
                <label className="text-sm text-palette-dark/80 font-semibold mb-2">
                  Current Symptoms
                </label>
                <Textarea
                  name="current_symptoms"
                  placeholder="Describe your current symptoms (e.g., pain, swelling, weakness, etc.)"
                  value={formData.current_symptoms || ''}
                  onChange={handleChange}
                  style={{ minHeight: '40px', height: '40px' }}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                >
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
