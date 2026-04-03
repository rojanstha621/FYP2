import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { videoAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import SegmentLoopYouTubePlayer from '../components/SegmentLoopYouTubePlayer';
import {
  FiPlay, FiCheckCircle, FiClock, FiUser,
  FiLock, FiCalendar, FiBarChart2,
} from 'react-icons/fi';

function formatSecondsToTimestamp(seconds) {
  if (!Number.isInteger(seconds)) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Returns a human-readable countdown string until the target time today. */
function countdownUntil(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diffMs = target - now;
  if (diffMs <= 0) return null;
  const totalSec = Math.floor(diffMs / 1000);
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  if (hh > 0) return `${hh}h ${mm}m`;
  if (mm > 0) return `${mm}m ${ss}s`;
  return `${ss}s`;
}

/** Returns status badge info for a scheduled assignment card. */
function getScheduleStatus(assignment) {
  if (!assignment.is_scheduled) return null;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const start = assignment.schedule_start_date;
  const end = assignment.schedule_end_date;

  if (today < start) {
    return { type: 'future', label: `Starts ${start}`, color: 'bg-blue-100 text-blue-800' };
  }
  if (today > end) {
    return { type: 'ended', label: 'Schedule ended', color: 'bg-gray-100 text-gray-600' };
  }

  const todayLog = assignment.today_log;
  if (todayLog?.viewed) {
    return { type: 'done_today', label: 'Done for today ✅', color: 'bg-green-100 text-green-800' };
  }

  if (!assignment.is_available_today) {
    // Not yet unlocked today
    const countdown = countdownUntil(assignment.scheduled_time);
    return {
      type: 'locked',
      label: countdown ? `Unlocks in ${countdown}` : `Unlocks at ${assignment.scheduled_time}`,
      color: 'bg-yellow-100 text-yellow-800',
    };
  }

  return { type: 'available', label: 'Available now 🎬', color: 'bg-palette-mauve/20 text-palette-mauve' };
}

export default function PatientVideosPage() {
  useAuth();
  const [videos, setVideos] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Countdown tick — re-render every 30s so countdowns stay fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      const response = await videoAPI.getMyVideos(params);
      let videoList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || response.data?.data || [];

      if (statusFilter === 'viewed') {
        videoList = videoList.filter((v) => v.viewed);
      } else if (statusFilter === 'unviewed') {
        videoList = videoList.filter((v) => !v.viewed);
      } else if (statusFilter === 'available') {
        videoList = videoList.filter((v) => v.is_available_today);
      }

      setVideos(videoList);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await videoAPI.getVideoStatistics();
      setStatistics(response.data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
    fetchStatistics();
  }, [fetchVideos, fetchStatistics]);

  const handleViewVideo = (assignment) => {
    setSelectedVideo(assignment);
    setShowDetailModal(true);
    if (!assignment.is_scheduled && !assignment.viewed) {
      markAsViewed(assignment.id);
    }
  };

  const markAsViewed = async (videoId) => {
    try {
      const res = await videoAPI.markVideoViewed(videoId);
      // Check if backend returned an error (e.g. not available yet)
      if (res.data?.error) {
        setError(res.data.message);
        return;
      }
      setSuccess('Video marked as viewed');
      fetchVideos();
      fetchStatistics();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to mark video as viewed';
      setError(msg);
    }
  };

  const handleMarkViewedFromModal = async () => {
    if (!selectedVideo) return;
    try {
      const res = await videoAPI.markVideoViewed(selectedVideo.id);
      if (res.data?.error) {
        setError(res.data?.message || 'Could not mark as viewed');
        return;
      }
      setSuccess('Video marked as viewed for today!');
      setShowDetailModal(false);
      fetchVideos();
      fetchStatistics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark video as viewed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-palette-dark">My Educational Videos</h1>
        <p className="text-palette-dark/70 mt-2">Videos assigned to you by your therapist</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Assigned', value: statistics.total_assigned, icon: FiPlay, color: 'bg-palette-mauve' },
            { label: 'Viewed', value: statistics.total_viewed, icon: FiCheckCircle, color: 'bg-green-500' },
            { label: 'Unviewed', value: statistics.total_unviewed, icon: FiClock, color: 'bg-yellow-500' },
            { label: 'Completion', value: `${statistics.completion_rate}%`, icon: FiCheckCircle, color: 'bg-palette-dark' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-palette-cream rounded-lg shadow-sm p-5 border border-palette-mauve/20 flex items-center gap-4">
              <div className={`${color} rounded-md p-3`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-palette-dark/60">{label}</p>
                <p className="text-2xl font-semibold text-palette-dark">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scheduled stats row */}
      {statistics?.scheduled && statistics.scheduled.total_days > 0 && (
        <div className="bg-palette-cream rounded-lg border border-palette-mauve/20 p-4 mb-6">
          <p className="text-sm font-semibold text-palette-dark mb-3 flex items-center gap-2">
            <FiCalendar /> Daily Schedule Overview
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Days', value: statistics.scheduled.total_days, color: 'text-blue-700' },
              { label: 'Days Viewed', value: statistics.scheduled.viewed_days, color: 'text-green-700' },
              { label: 'Days Missed', value: statistics.scheduled.missed_days, color: 'text-red-600' },
              { label: 'Remaining', value: statistics.scheduled.remaining_days, color: 'text-yellow-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-palette-dark/60 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {/* mini bar */}
          <div className="mt-3 w-full bg-palette-beige rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{
                width: `${statistics.scheduled.total_days > 0
                  ? (statistics.scheduled.viewed_days / statistics.scheduled.total_days) * 100
                  : 0}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-palette-cream p-4 rounded-lg shadow-sm mb-6 border border-palette-mauve/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-palette-dark/80 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title..."
              className="w-full px-3 py-2 border border-palette-mauve/30 rounded-md bg-palette-beige/40 text-palette-dark focus:outline-none focus:ring-2 focus:ring-palette-mauve"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-palette-dark/80 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-palette-mauve/30 rounded-md bg-palette-beige/40 text-palette-dark focus:outline-none focus:ring-2 focus:ring-palette-mauve"
            >
              <option value="">All Videos</option>
              <option value="available">Available Now</option>
              <option value="unviewed">Not Viewed</option>
              <option value="viewed">Viewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : videos.length === 0 ? (
        <div className="bg-palette-cream rounded-lg shadow-sm p-12 text-center border border-palette-mauve/20">
          <FiPlay className="mx-auto h-12 w-12 text-palette-dark/40" />
          <h3 className="mt-2 text-lg font-medium text-palette-dark">No videos assigned yet</h3>
          <p className="mt-1 text-sm text-palette-dark/60">
            Your therapist hasn't assigned any videos to you yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((assignment) => {
            const schedStatus = getScheduleStatus(assignment);
            const isLocked = schedStatus?.type === 'locked' || schedStatus?.type === 'future';
            const isDoneToday = schedStatus?.type === 'done_today';
            const isEnded = schedStatus?.type === 'ended';

            return (
              <div
                key={assignment.id}
                className={`bg-palette-cream rounded-lg shadow-sm overflow-hidden border transition-shadow ${
                  isLocked || isDoneToday || isEnded
                    ? 'opacity-70 border-palette-mauve/10'
                    : 'hover:shadow-md border-palette-mauve/20'
                }`}
              >
                {/* Thumbnail */}
                <div
                  className="aspect-video bg-palette-beige relative group cursor-pointer"
                  onClick={() => handleViewVideo(assignment)}
                >
                  <img
                    src={assignment.video_details.thumbnail_url}
                    alt={assignment.video_details.title}
                    className={`w-full h-full object-cover ${isLocked || isDoneToday || isEnded ? 'grayscale' : ''}`}
                  />

                  {/* Overlay */}
                  {isLocked ? (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                      <FiLock className="text-white text-4xl" />
                      <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                        {schedStatus.label}
                      </span>
                    </div>
                  ) : isDoneToday ? (
                    <div className="absolute inset-0 bg-green-900/30 flex items-center justify-center">
                      <FiCheckCircle className="text-white text-5xl" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <FiPlay className="text-white text-5xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}

                  {/* Status badge */}
                  {schedStatus && (
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${schedStatus.color}`}>
                      {schedStatus.label}
                    </div>
                  )}

                  {/* "viewed once" badge for non-scheduled */}
                  {!assignment.is_scheduled && assignment.viewed && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <FiCheckCircle className="text-xs" /> Viewed
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-palette-dark mb-1">
                    {assignment.video_details.title}
                  </h3>
                  <p className="text-sm text-palette-dark/70 line-clamp-2 mb-3">
                    {assignment.video_details.description}
                  </p>

                  {/* Therapist note */}
                  {assignment.notes && (
                    <div className="mb-3 p-2 bg-palette-beige rounded text-sm border border-palette-mauve/20">
                      <strong>Therapist Note:</strong> {assignment.notes}
                    </div>
                  )}

                  {/* Segment info */}
                  {Number.isInteger(assignment.segment_start_seconds) && Number.isInteger(assignment.segment_end_seconds) && (
                    <div className="mb-3 p-2 bg-palette-beige rounded text-sm border border-palette-mauve/20">
                      <strong>Watch:</strong> {formatSecondsToTimestamp(assignment.segment_start_seconds)} –{' '}
                      {formatSecondsToTimestamp(assignment.segment_end_seconds)} ×{assignment.repeat_count || 1}
                      {assignment.pause_between_repeats_seconds > 0 && `, ${assignment.pause_between_repeats_seconds}s pause`}
                    </div>
                  )}

                  {/* Schedule summary for the card */}
                  {assignment.is_scheduled && (
                    <div className="mb-3 p-2 bg-palette-beige rounded text-xs border border-palette-mauve/20 space-y-0.5">
                      <div className="flex items-center gap-1 text-palette-dark/80">
                        <FiCalendar className="text-palette-mauve" />
                        {assignment.schedule_start_date} → {assignment.schedule_end_date}
                        &nbsp;({assignment.schedule_duration_days} days)
                      </div>
                      <div className="flex items-center gap-1 text-palette-dark/80">
                        <FiClock className="text-palette-mauve" />
                        Unlocks daily at {assignment.scheduled_time}
                      </div>
                      {/* mini progress bar */}
                      {assignment.today_log !== undefined && (
                        <div className="flex items-center gap-1 mt-1">
                          <FiBarChart2 className="text-palette-mauve" />
                          <span>
                            Today:{' '}
                            {assignment.today_log?.viewed
                              ? <span className="text-green-700 font-medium">Watched</span>
                              : assignment.is_available_today
                              ? <span className="text-palette-mauve font-medium">Ready to watch</span>
                              : <span className="text-yellow-700">Pending unlock</span>}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm text-palette-dark/60 mb-3">
                    <div className="flex items-center gap-1">
                      <FiUser className="text-xs" />
                      <span>{assignment.therapist_name}</span>
                    </div>
                    <span>{new Date(assignment.assigned_at).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => handleViewVideo(assignment)}
                    className={`w-full px-4 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                      isLocked || isEnded
                        ? 'bg-palette-beige text-palette-dark/70 hover:bg-palette-mauve/20'
                        : isDoneToday
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-palette-mauve text-white hover:bg-palette-dark'
                    }`}
                  >
                    {isLocked ? (
                      <><FiPlay /> Open Video</>
                    ) : isDoneToday ? (
                      <><FiPlay /> Watch Again</>
                    ) : isEnded ? (
                      <><FiPlay /> Open Video</>
                    ) : (
                      <><FiPlay /> Watch Video</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Detail Modal */}
      {showDetailModal && selectedVideo && (
        <div className="fixed inset-0 bg-palette-dark/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-palette-mauve/20 w-full max-w-4xl shadow-lg rounded-md bg-palette-cream">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-palette-dark">
                {selectedVideo.video_details.title}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-palette-dark/50 hover:text-palette-dark text-2xl"
              >×</button>
            </div>

            <div className="space-y-4">
              <div className="aspect-video w-full bg-gray-900 rounded-lg overflow-hidden">
                <SegmentLoopYouTubePlayer
                  embedUrl={selectedVideo.video_details.youtube_embed_url}
                  title={selectedVideo.video_details.title}
                  segmentStartSeconds={selectedVideo.segment_start_seconds}
                  segmentEndSeconds={selectedVideo.segment_end_seconds}
                  repeatCount={selectedVideo.repeat_count || 1}
                  pauseBetweenRepeatsSeconds={selectedVideo.pause_between_repeats_seconds || 0}
                />
              </div>

              <div className="bg-palette-beige/60 p-4 rounded-lg border border-palette-mauve/20">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                  <div>
                    <p className="text-sm text-palette-dark/60">Assigned by</p>
                    <p className="font-medium text-palette-dark">{selectedVideo.therapist_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-palette-dark/60">Assigned on</p>
                    <p className="font-medium text-palette-dark">
                      {new Date(selectedVideo.assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-palette-dark/60">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedVideo.viewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedVideo.viewed ? 'Viewed' : 'Not Viewed'}
                    </span>
                  </div>
                </div>

                {selectedVideo.notes && (
                  <div className="mt-3 p-3 bg-palette-cream border-l-4 border-palette-mauve">
                    <p className="text-sm font-medium text-palette-dark mb-1">Therapist Instructions:</p>
                    <p className="text-sm text-palette-dark/80">{selectedVideo.notes}</p>
                  </div>
                )}

                {Number.isInteger(selectedVideo.segment_start_seconds) && Number.isInteger(selectedVideo.segment_end_seconds) && (
                  <div className="mt-3 p-3 bg-palette-cream border-l-4 border-palette-dark">
                    <p className="text-sm font-medium text-palette-dark mb-1">Playback Target:</p>
                    <p className="text-sm text-palette-dark/80">
                      {formatSecondsToTimestamp(selectedVideo.segment_start_seconds)} to{' '}
                      {formatSecondsToTimestamp(selectedVideo.segment_end_seconds)} for{' '}
                      {selectedVideo.repeat_count || 1} rounds
                      {selectedVideo.pause_between_repeats_seconds > 0
                        ? ` with a ${selectedVideo.pause_between_repeats_seconds}s pause between rounds`
                        : ''}.
                    </p>
                  </div>
                )}

                {selectedVideo.is_scheduled && (
                  <div className="mt-3 p-3 bg-palette-cream border-l-4 border-blue-400">
                    <p className="text-sm font-medium text-palette-dark mb-1">
                      <FiCalendar className="inline mr-1" /> Daily Schedule
                    </p>
                    <p className="text-sm text-palette-dark/80">
                      {selectedVideo.schedule_start_date} → {selectedVideo.schedule_end_date} ·{' '}
                      Unlocks at {selectedVideo.scheduled_time} every day
                    </p>
                    <p className="text-xs text-palette-dark/60 mt-1">
                      After you watch it today, it will reappear tomorrow at the same time.
                    </p>
                    {!selectedVideo.is_available_today && (
                      <p className="text-xs text-yellow-700 mt-1">
                        You can still play this video now, but it can be marked as watched only during the daily unlock window.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-palette-dark mb-2">About this video</h4>
                <p className="text-sm text-palette-dark/70">{selectedVideo.video_details.description}</p>
              </div>

              {selectedVideo.viewed && selectedVideo.viewed_at && (
                <div className="text-sm text-palette-dark/60">
                  First viewed on {new Date(selectedVideo.viewed_at).toLocaleString()}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 text-sm font-medium text-palette-dark bg-palette-beige border border-palette-mauve/30 rounded-md hover:bg-palette-mauve/20"
              >
                Close
              </button>

              {/* For scheduled assignments: show "Mark as Watched Today" button */}
              {selectedVideo.is_scheduled && selectedVideo.is_available_today && !selectedVideo.today_log?.viewed && (
                <button
                  onClick={handleMarkViewedFromModal}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <FiCheckCircle /> Mark as Watched Today
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
