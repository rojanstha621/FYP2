import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiCalendar, FiCheckCircle, FiClock, FiPlayCircle, FiTrendingUp } from 'react-icons/fi';
import {
  getDailyProgress,
  getProgressSummary,
  getWeeklyProgress,
} from '../../api/progressApi';
import { videoAPI } from '../../services/api';

const toDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [videoStats, setVideoStats] = useState(null);
  const [date, setDate] = useState(todayString);
  const [weekStart, setWeekStart] = useState(weekStartString);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dailyPercent = Math.min(Math.max(Number(daily?.completion_percentage || 0), 0), 100);
  const weeklyPercent = Math.min(Math.max(Number(weekly?.completion_percentage || 0), 0), 100);

  const loadAll = async (selectedDate, selectedWeekStart) => {
    try {
      setLoading(true);
      setError('');
      const [summaryData, dailyData, weeklyData] = await Promise.all([
        getProgressSummary(),
        getDailyProgress(selectedDate),
        getWeeklyProgress(selectedWeekStart),
      ]);

      let fetchedVideoStats = null;
      try {
        const videoResponse = await videoAPI.getVideoStatistics();
        fetchedVideoStats = videoResponse?.data || null;
      } catch {
        fetchedVideoStats = null;
      }

      setSummary(summaryData);
      setDaily(dailyData);
      setWeekly(weeklyData);
      setVideoStats(fetchedVideoStats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(date, weekStart);
  }, [date, weekStart]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-2xl p-6 bg-gradient-to-r from-palette-mauve/20 via-palette-blush/20 to-palette-beige border border-palette-mauve/20 animate-pulse">
          <div className="h-8 w-56 bg-palette-cream/80 rounded mb-3" />
          <div className="h-4 w-80 bg-palette-cream/70 rounded" />
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="rounded-xl bg-palette-cream p-4 shadow-sm border border-palette-mauve/15 animate-pulse">
              <div className="h-4 w-24 bg-palette-beige rounded mb-3" />
              <div className="h-8 w-16 bg-palette-beige rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-palette-cream p-5 shadow-sm border border-palette-mauve/15 animate-pulse">
          <div className="h-5 w-40 bg-palette-beige rounded mb-4" />
          <div className="h-3 w-full bg-palette-beige rounded" />
        </div>
      </div>
    );
  }

  const totalSessions = Number(summary?.total_sessions_all_time || 0);
  const completedSessions = Number(summary?.completed_all_time || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <section className="rounded-2xl p-6 bg-gradient-to-r from-palette-mauve/20 via-palette-blush/20 to-palette-beige border border-palette-mauve/20 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-palette-dark">My Progress</h1>
            <p className="mt-2 text-palette-dark/70 max-w-2xl">
              See your recovery consistency, session outcomes, and video schedule adherence in one place.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-palette-cream/80 border border-palette-mauve/20 text-palette-dark/80 text-sm">
            <FiTrendingUp /> Keep your streak alive
          </div>
        </div>
      </section>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-palette-cream p-4 shadow-sm border border-palette-mauve/20">
          <p className="text-sm text-palette-dark/70 inline-flex items-center gap-1"><FiPlayCircle /> Total Sessions</p>
          <p className="text-2xl font-bold text-palette-dark">{totalSessions}</p>
        </div>
        <div className="rounded-xl bg-palette-cream p-4 shadow-sm border border-palette-mauve/20">
          <p className="text-sm text-palette-dark/70 inline-flex items-center gap-1"><FiCheckCircle /> Completed</p>
          <p className="text-2xl font-bold text-green-700">{completedSessions}</p>
        </div>
        <div className="rounded-xl bg-palette-cream p-4 shadow-sm border border-palette-mauve/20">
          <p className="text-sm text-palette-dark/70 inline-flex items-center gap-1"><FiTrendingUp /> Current Streak</p>
          <p className="text-2xl font-bold text-blue-700">{summary?.current_streak || 0}</p>
        </div>
        <div className="rounded-xl bg-palette-cream p-4 shadow-sm border border-palette-mauve/20">
          <p className="text-sm text-palette-dark/70 inline-flex items-center gap-1"><FiCalendar /> Last Session</p>
          <p className="text-sm font-semibold text-palette-dark">
            {summary?.last_session_date ? new Date(summary.last_session_date).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl bg-palette-cream p-5 shadow-sm border border-palette-mauve/20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-palette-dark inline-flex items-center gap-2"><FiActivity /> Daily Progress</h2>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-palette-mauve/30 px-3 py-2 bg-palette-beige/40"
          />
        </div>

        <div className="mb-3 text-sm text-palette-dark/80 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-palette-beige/40 border border-palette-mauve/15 p-3">
            <p className="text-xs">Completion</p>
            <p className="text-lg font-semibold">{dailyPercent}%</p>
          </div>
          <div className="rounded-lg bg-palette-beige/40 border border-palette-mauve/15 p-3">
            <p className="text-xs inline-flex items-center gap-1"><FiClock /> Total Duration</p>
            <p className="text-lg font-semibold">{Math.round((daily?.total_duration_seconds || 0) / 60)} min</p>
          </div>
        </div>

        <div className="h-3.5 w-full rounded-full bg-palette-beige">
          <div
            className="h-3.5 rounded-full bg-gradient-to-r from-palette-mauve to-palette-dark"
            style={{ width: `${dailyPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-palette-cream p-5 shadow-sm border border-palette-mauve/20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-palette-dark inline-flex items-center gap-2"><FiTrendingUp /> Weekly Progress</h2>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="rounded-md border border-palette-mauve/30 px-3 py-2 bg-palette-beige/40"
          />
        </div>

        <p className="mb-3 text-sm text-palette-dark/80">
          Completed {weekly?.completed_sessions || 0} of {weekly?.total_sessions || 0} sessions
        </p>

        <div className="h-3.5 w-full rounded-full bg-palette-beige">
          <div
            className="h-3.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-700"
            style={{ width: `${weeklyPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-palette-cream p-5 shadow-sm border border-palette-mauve/20">
        <h2 className="mb-4 text-xl font-semibold text-palette-dark inline-flex items-center gap-2"><FiPlayCircle /> Video Progress</h2>

        {videoStats ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-palette-beige/35 border border-palette-mauve/15 p-3">
                <p className="text-sm text-palette-dark/70">Assigned Videos</p>
                <p className="text-2xl font-bold text-palette-dark">{videoStats.total_assigned || 0}</p>
              </div>
              <div className="rounded-lg bg-palette-beige/35 border border-palette-mauve/15 p-3">
                <p className="text-sm text-palette-dark/70">Viewed Videos</p>
                <p className="text-2xl font-bold text-green-700">{videoStats.total_viewed || 0}</p>
              </div>
              <div className="rounded-lg bg-palette-beige/35 border border-palette-mauve/15 p-3">
                <p className="text-sm text-palette-dark/70">Unviewed Videos</p>
                <p className="text-2xl font-bold text-yellow-700">{videoStats.total_unviewed || 0}</p>
              </div>
              <div className="rounded-lg bg-palette-beige/35 border border-palette-mauve/15 p-3">
                <p className="text-sm text-palette-dark/70">Completion</p>
                <p className="text-2xl font-bold text-blue-700">{videoStats.completion_rate || 0}%</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-palette-dark/80">
                Scheduled Days Completed {videoStats?.scheduled?.viewed_days || 0} / {videoStats?.scheduled?.total_days || 0}
              </p>
              <div className="h-3.5 w-full rounded-full bg-palette-beige">
                <div
                  className="h-3.5 rounded-full bg-gradient-to-r from-palette-mauve to-palette-dark"
                  style={{
                    width: `${(videoStats?.scheduled?.total_days || 0) > 0
                      ? ((videoStats?.scheduled?.viewed_days || 0) / (videoStats?.scheduled?.total_days || 1)) * 100
                      : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-palette-dark/70">
                Missed Days: {videoStats?.scheduled?.missed_days || 0} | Remaining Days: {videoStats?.scheduled?.remaining_days || 0}
              </p>
            </div>

          </div>
        ) : (
          <p className="text-sm text-palette-dark/70">Video progress is not available right now.</p>
        )}
      </div>
    </div>
  );
}
