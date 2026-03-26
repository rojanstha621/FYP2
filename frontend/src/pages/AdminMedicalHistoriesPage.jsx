import { useState, useEffect } from 'react';
import { medicalAPI } from '../services/api';
import { Card, Button, Select } from '../components/FormElements';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export default function AdminMedicalHistoriesPage() {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchHistories();
  }, []);

  const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;
    return [];
  };

  const fetchHistories = async () => {
    try {
      const response = await medicalAPI.getMedicalHistories();
      const historyData = extractList(response.data);
      setHistories(historyData);
      setError('');
    } catch (err) {
      setError('Failed to load medical histories');
      setHistories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistories = roleFilter
    ? histories.filter(h => h.patient_details?.role === roleFilter)
    : histories;

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-palette-dark mb-8">All Medical Histories</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <Card className="mb-8">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-palette-dark/80 mb-2">Filter by Patient Role</label>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All Patients</option>
              <option value="PATIENT">Patient</option>
              <option value="THERAPIST">Therapist</option>
            </Select>
          </div>
          <div>
            <p className="text-sm text-palette-dark/70">
              Showing {filteredHistories.length} of {histories.length} records
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6">
        {filteredHistories.map((history) => (
          <Card key={history.id} className="hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-palette-dark">
                  {history.patient_details?.first_name} {history.patient_details?.last_name}
                </h3>
                <p className="text-palette-dark/60 text-sm">{history.patient_details?.email}</p>
              </div>
              <span className="px-3 py-1 bg-palette-cream text-palette-dark rounded-full text-sm font-medium">
                {history.patient_details?.role}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-palette-dark/70 font-semibold mb-1">Created</p>
                <p className="text-sm text-palette-dark">{new Date(history.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-palette-dark/70 font-semibold mb-1">Last Updated</p>
                <p className="text-sm text-palette-dark">{new Date(history.updated_at).toLocaleDateString()}</p>
              </div>
            </div>

            <Button variant="ghost" className="text-sm" onClick={() => setSelectedHistory(history)}>
              View Full Details →
            </Button>
          </Card>
        ))}
      </div>

      {filteredHistories.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-palette-dark/70">No medical histories found</p>
        </Card>
      )}

      {/* Detail Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="max-w-3xl w-full my-8">
            <button
              onClick={() => setSelectedHistory(null)}
              className="float-right text-2xl font-bold text-palette-dark/60 hover:text-palette-dark"
            >
              ✕
            </button>

            <h2 className="text-3xl font-bold text-palette-dark mb-2 clear-right">
              Medical History Details
            </h2>
            <p className="text-palette-dark/70 mb-6">
              {selectedHistory.patient_details?.first_name} {selectedHistory.patient_details?.last_name} ({selectedHistory.patient_details?.email})
            </p>

            <div className="space-y-6">
              <div className="p-4 bg-palette-cream/50 rounded-lg">
                <h3 className="text-lg font-semibold text-palette-dark mb-2">Past Injuries</h3>
                <p className="text-palette-dark/70 whitespace-pre-wrap">
                  {selectedHistory.past_injuries || 'No past injuries recorded'}
                </p>
              </div>

              <div className="p-4 bg-palette-cream/50 rounded-lg">
                <h3 className="text-lg font-semibold text-palette-dark mb-2">Chronic Conditions</h3>
                <p className="text-palette-dark/70 whitespace-pre-wrap">
                  {selectedHistory.chronic_conditions || 'No chronic conditions recorded'}
                </p>
              </div>

              <div className="p-4 bg-palette-cream/50 rounded-lg">
                <h3 className="text-lg font-semibold text-palette-dark mb-2">Surgeries</h3>
                <p className="text-palette-dark/70 whitespace-pre-wrap">
                  {selectedHistory.surgeries || 'No surgeries recorded'}
                </p>
              </div>

              <div className="p-4 bg-palette-cream/50 rounded-lg">
                <h3 className="text-lg font-semibold text-palette-dark mb-2">Current Medications</h3>
                <p className="text-palette-dark/70 whitespace-pre-wrap">
                  {selectedHistory.medications || 'No medications recorded'}
                </p>
              </div>

              <div className="p-4 bg-palette-cream/50 rounded-lg">
                <h3 className="text-lg font-semibold text-palette-dark mb-2">Allergies</h3>
                <p className="text-palette-dark/70 whitespace-pre-wrap">
                  {selectedHistory.allergies || 'No allergies recorded'}
                </p>
              </div>

              <div className="p-4 bg-palette-cream/50 rounded-lg">
                <h3 className="text-lg font-semibold text-palette-dark mb-2">Current Symptoms</h3>
                <p className="text-palette-dark/70 whitespace-pre-wrap">
                  {selectedHistory.current_symptoms || 'No symptoms recorded'}
                </p>
              </div>

              {selectedHistory.medical_report && (
                <div className="p-4 bg-palette-cream/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-palette-dark mb-2">Medical Report</h3>
                  <a
                    href={selectedHistory.medical_report}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-palette-mauve hover:text-palette-dark underline"
                  >
                    View Report Document
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 mt-6 border-t">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedHistory(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
