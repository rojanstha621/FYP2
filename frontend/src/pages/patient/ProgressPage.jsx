import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '../../components/Spinner';
import {
  getDailyProgress,
  getProgressSummary,
  getWeeklyProgress,
} from '../../api/progressApi';

const toDateInput = (date) => date.toISOString().slice(0, 10);

const getWeekMonday = (dateObj) => {
  const date = new Date(dateObj);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date;
};

export default function ProgressPage() {
  const todayString = useMemo(() => toDateInput(new Date()), []);
  const weekStartString = useMemo(() => toDateInput(getWeekMonday(new Date())), []);

  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [date, setDate] = useState(todayString);
  const [weekStart, setWeekStart] = useState(weekStartString);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = async (selectedDate, selectedWeekStart) => {
    try {
      setLoading(true);
      setError('');
      const [summaryData, dailyData, weeklyData] = await Promise.all([
        getProgressSummary(),
        getDailyProgress(selectedDate),
        getWeeklyProgress(selectedWeekStart),
      ]);
      setSummary(summaryData);
      setDaily(dailyData);
      setWeekly(weeklyData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(date, weekStart);
  }, [date, weekStart]);

  if (loading) return <Spinner />;

  const totalSessions = Number(summary?.total_sessions_all_time || 0);
  const completedSessions = Number(summary?.completed_all_time || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-palette-dark">My Progress</h1>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-palette-cream p-4 shadow-sm">
          <p className="text-sm text-palette-dark/70">Total Sessions</p>
          <p className="text-2xl font-bold text-palette-dark">{totalSessions}</p>
        </div>
        <div className="rounded-lg bg-palette-cream p-4 shadow-sm">
          <p className="text-sm text-palette-dark/70">Completed</p>
          <p className="text-2xl font-bold text-green-700">{completedSessions}</p>
        </div>
        <div className="rounded-lg bg-palette-cream p-4 shadow-sm">
          <p className="text-sm text-palette-dark/70">Current Streak</p>
          <p className="text-2xl font-bold text-blue-700">{summary?.current_streak || 0}</p>
        </div>
        <div className="rounded-lg bg-palette-cream p-4 shadow-sm">
          <p className="text-sm text-palette-dark/70">Last Session</p>
          <p className="text-sm font-semibold text-palette-dark">
            {summary?.last_session_date ? new Date(summary.last_session_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-lg bg-palette-cream p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-palette-dark">Daily Progress</h2>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-palette-mauve/30 px-3 py-2"
          />
        </div>

        <div className="mb-3 text-sm text-palette-dark/80">
          <p>Completion: {daily?.completion_percentage || 0}%</p>
          <p>Total Duration: {Math.round((daily?.total_duration_seconds || 0) / 60)} min</p>
        </div>

        <div className="h-3 w-full rounded-full bg-palette-beige">
          <div
            className="h-3 rounded-full bg-blue-600"
            style={{ width: `${daily?.completion_percentage || 0}%` }}
          />
        </div>
      </div>

      <div className="rounded-lg bg-palette-cream p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-palette-dark">Weekly Progress</h2>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="rounded-md border border-palette-mauve/30 px-3 py-2"
          />
        </div>

        <p className="mb-3 text-sm text-palette-dark/80">
          Completed {weekly?.completed_sessions || 0} of {weekly?.total_sessions || 0} sessions
        </p>

        <div className="h-3 w-full rounded-full bg-palette-beige">
          <div
            className="h-3 rounded-full bg-green-600"
            style={{ width: `${weekly?.completion_percentage || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
