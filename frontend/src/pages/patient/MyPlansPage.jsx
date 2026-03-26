import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spinner } from '../../components/Spinner';
import { getExercisePlans } from '../../api/exercisePlansApi';

const formatFrequency = (value) => {
  if (!value) return 'N/A';
  return value.replaceAll('_', ' ');
};

export default function MyPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getExercisePlans();
        setPlans(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load exercise plans');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-palette-dark">My Exercise Plans</h1>
        <Link
          to="/patient/sessions"
          className="rounded-md bg-palette-mauve px-4 py-2 text-sm font-medium text-white hover:bg-palette-dark"
        >
          View Sessions
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
      )}

      {plans.length === 0 ? (
        <div className="rounded-lg bg-palette-cream p-8 text-center text-palette-dark/70">
          No active plans assigned yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-lg border border-palette-mauve/20 bg-palette-cream p-5 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between">
                <h2 className="text-lg font-semibold text-palette-dark">{plan.exercise_name}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-1 text-sm text-palette-dark/80">
                <p>Therapist: {plan.therapist_name || 'N/A'}</p>
                <p>Frequency: {formatFrequency(plan.frequency)}</p>
                <p>Sets: {plan.sets}</p>
                <p>
                  Duration/Rest: {plan.exercise_duration}s / {plan.rest_duration}s
                </p>
                <p>
                  Scheduled date:{' '}
                  {plan.scheduled_date ? new Date(plan.scheduled_date).toLocaleDateString() : 'N/A'}
                </p>
                {plan.special_instructions && <p>Notes: {plan.special_instructions}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
