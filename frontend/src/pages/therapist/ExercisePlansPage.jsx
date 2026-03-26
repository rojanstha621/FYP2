import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import {
  createExercisePlan,
  deleteExercisePlan,
  getExercisePlans,
  getExercisesForPlans,
  getTherapistAssignments,
  toggleExercisePlanActive,
} from '../../api/exercisePlansApi';

const defaultForm = {
  patient: '',
  exercise: '',
  duration: 60,
  rest_duration: 20,
  sets: 3,
  frequency: 'DAILY',
  notes: '',
  is_active: true,
  scheduled_date: '',
};

const frequencyOptions = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'EVERY_OTHER_DAY', label: 'Every Other Day' },
  { value: 'THREE_TIMES_WEEK', label: 'Three Times a Week' },
  { value: 'WEEKLY', label: 'Weekly' },
];

const formatName = (assignment) => {
  const firstName = assignment?.patient_details?.first_name || '';
  const lastName = assignment?.patient_details?.last_name || '';
  const full = `${firstName} ${lastName}`.trim();
  return full || `Patient #${assignment?.patient}`;
};

export default function ExercisePlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(defaultForm);

  const patientOptions = useMemo(() => {
    const myAssignments = assignments.filter(
      (assignment) => Number(assignment.therapist) === Number(user?.id) && assignment.is_active
    );

    const unique = new Map();
    myAssignments.forEach((assignment) => {
      if (!unique.has(assignment.patient)) {
        unique.set(assignment.patient, {
          id: assignment.patient,
          label: formatName(assignment),
        });
      }
    });

    return Array.from(unique.values());
  }, [assignments, user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [planData, exerciseData, assignmentData] = await Promise.all([
        getExercisePlans(),
        getExercisesForPlans(),
        getTherapistAssignments(),
      ]);
      setPlans(planData);
      setExercises(exerciseData);
      setAssignments(assignmentData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load exercise plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await createExercisePlan({
        patient: Number(formData.patient),
        exercise: Number(formData.exercise),
        duration: Number(formData.duration),
        rest_duration: Number(formData.rest_duration),
        sets: Number(formData.sets),
        frequency: formData.frequency,
        notes: formData.notes,
        is_active: Boolean(formData.is_active),
        scheduled_date: formData.scheduled_date,
      });

      setSuccess('Exercise plan created successfully');
      setFormData(defaultForm);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create exercise plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (planId) => {
    try {
      setError('');
      await toggleExercisePlanActive(planId);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to toggle plan status');
    }
  };

  const handleDelete = async (planId) => {
    try {
      setError('');
      await deleteExercisePlan(planId);
      setSuccess('Exercise plan deleted');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete exercise plan');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-palette-dark">Exercise Plans</h1>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-md bg-palette-mauve px-4 py-2 text-sm font-medium text-white hover:bg-palette-dark"
        >
          {showForm ? 'Close Form' : 'Create Plan'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-700">{success}</div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-lg border border-palette-mauve/20 bg-palette-cream p-5 shadow-sm"
        >
          <h2 className="mb-4 text-xl font-semibold text-palette-dark">New Exercise Plan</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-palette-dark">
              Patient
              <select
                required
                name="patient"
                value={formData.patient}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-palette-mauve/30 px-3 py-2"
              >
                <option value="">Select patient</option>
                {patientOptions.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-palette-dark">
              Exercise
              <select
                required
                name="exercise"
                value={formData.exercise}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-palette-mauve/30 px-3 py-2"
              >
                <option value="">Select exercise</option>
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-palette-dark">
              Duration (seconds)
              <input
                required
                min="10"
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-palette-mauve/30 px-3 py-2"
              />
            </label>

            <label className="text-sm text-palette-dark">
              Rest (seconds)
              <input
                required
                min="0"
                type="number"
                name="rest_duration"
                value={formData.rest_duration}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-palette-mauve/30 px-3 py-2"
              />
            </label>

            <label className="text-sm text-palette-dark">
              Sets
              <input
                required
                min="1"
                type="number"
                name="sets"
                value={formData.sets}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-palette-mauve/30 px-3 py-2"
              />
            </label>

            <label className="text-sm text-palette-dark">
              Frequency
              <select
                required
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-palette-mauve/30 px-3 py-2"
              >
                {frequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-palette-dark">
              Scheduled date
              <input
                required
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-palette-mauve/30 px-3 py-2"
              />
            </label>

            <label className="flex items-center gap-2 pt-7 text-sm text-palette-dark">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              Active plan
            </label>
          </div>

          <label className="mt-4 block text-sm text-palette-dark">
            Notes
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded-md border border-palette-mauve/30 px-3 py-2"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-md bg-palette-mauve px-4 py-2 text-sm font-medium text-white hover:bg-palette-dark disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Plan'}
          </button>
        </form>
      )}

      {plans.length === 0 ? (
        <div className="rounded-lg bg-palette-cream p-8 text-center text-palette-dark/70">
          No exercise plans yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-lg border border-palette-mauve/20 bg-palette-cream p-5 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-palette-dark">{plan.exercise_name}</h2>
                  <p className="text-sm text-palette-dark/70">{plan.patient_name}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-1 text-sm text-palette-dark/80">
                <p>Frequency: {plan.frequency.replaceAll('_', ' ')}</p>
                <p>Sets: {plan.sets}</p>
                <p>
                  Duration/Rest: {plan.exercise_duration}s / {plan.rest_duration}s
                </p>
                <p>
                  Scheduled: {plan.scheduled_date ? new Date(plan.scheduled_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(plan.id)}
                  className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Toggle Active
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(plan.id)}
                  className="rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
