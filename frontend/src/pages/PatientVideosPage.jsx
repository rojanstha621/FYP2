import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { videoAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import SegmentLoopYouTubePlayer from '../components/SegmentLoopYouTubePlayer';
import { FiPlay, FiCheckCircle, FiClock, FiUser } from 'react-icons/fi';

function formatSecondsToTimestamp(seconds) {
  if (!Number.isInteger(seconds)) {
    return null;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function PatientVideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'viewed' or 'unviewed'
  
  // Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    fetchVideos();
    fetchStatistics();
  }, [searchTerm, statusFilter]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      
      const response = await videoAPI.getMyVideos(params);
      // Handle response data - it might be an array or have a data/results property
      let videoList = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.data || []);
      
      // Apply status filter
      if (statusFilter === 'viewed') {
        videoList = videoList.filter(v => v.viewed);
      } else if (statusFilter === 'unviewed') {
        videoList = videoList.filter(v => !v.viewed);
      }
      
      setVideos(videoList);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await videoAPI.getVideoStatistics();
      setStatistics(response.data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleViewVideo = (video) => {
    setSelectedVideo(video);
    setShowDetailModal(true);
    
    // Mark as viewed if not already
    if (!video.viewed) {
      markAsViewed(video.id);
    }
  };

  const markAsViewed = async (videoId) => {
    try {
      await videoAPI.markVideoViewed(videoId);
      setSuccess('Video marked as viewed');
      fetchVideos();
      fetchStatistics();
    } catch (err) {
      console.error('Failed to mark video as viewed:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-palette-dark">My Educational Videos</h1>
        <p className="text-palette-dark/70 mt-2">Videos assigned to you by your therapist</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}
      {success && (
        <Alert type="success" message={success} onClose={() => setSuccess(null)} />
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-palette-cream rounded-lg shadow-sm p-6 border border-palette-mauve/20">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-palette-mauve rounded-md p-3">
                <FiPlay className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-palette-dark/60">Total Assigned</p>
                <p className="text-2xl font-semibold text-palette-dark">
                  {statistics.total_assigned}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-palette-cream rounded-lg shadow-sm p-6 border border-palette-mauve/20">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <FiCheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-palette-dark/60">Viewed</p>
                <p className="text-2xl font-semibold text-palette-dark">
                  {statistics.total_viewed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-palette-cream rounded-lg shadow-sm p-6 border border-palette-mauve/20">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <FiClock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-palette-dark/60">Unviewed</p>
                <p className="text-2xl font-semibold text-palette-dark">
                  {statistics.total_unviewed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-palette-cream rounded-lg shadow-sm p-6 border border-palette-mauve/20">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-palette-dark rounded-md p-3">
                <FiCheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-palette-dark/60">Completion</p>
                <p className="text-2xl font-semibold text-palette-dark">
                  {statistics.completion_rate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-palette-cream p-4 rounded-lg shadow-sm mb-6 border border-palette-mauve/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-palette-dark/80 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title..."
              className="w-full px-3 py-2 border border-palette-mauve/30 rounded-md bg-palette-beige/40 text-palette-dark focus:outline-none focus:ring-2 focus:ring-palette-mauve"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-palette-dark/80 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-palette-mauve/30 rounded-md bg-palette-beige/40 text-palette-dark focus:outline-none focus:ring-2 focus:ring-palette-mauve"
            >
              <option value="">All Videos</option>
              <option value="unviewed">Not Viewed</option>
              <option value="viewed">Viewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
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
          {videos.map((assignment) => (
            <div key={assignment.id} className="bg-palette-cream rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-palette-mauve/20">
              <div className="aspect-video bg-palette-beige relative group cursor-pointer" onClick={() => handleViewVideo(assignment)}>
                <img
                  src={assignment.video_details.thumbnail_url}
                  alt={assignment.video_details.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <FiPlay className="text-white text-5xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {assignment.viewed && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <FiCheckCircle className="text-xs" /> Viewed
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-palette-dark mb-2">
                  {assignment.video_details.title}
                </h3>
                <p className="text-sm text-palette-dark/70 line-clamp-2 mb-3">
                  {assignment.video_details.description}
                </p>
                
                {assignment.notes && (
                  <div className="mb-3 p-2 bg-palette-beige rounded text-sm border border-palette-mauve/20">
                    <p className="text-palette-dark">
                      <strong>Therapist Note:</strong> {assignment.notes}
                    </p>
                  </div>
                )}

                {Number.isInteger(assignment.segment_start_seconds) && Number.isInteger(assignment.segment_end_seconds) && (
                  <div className="mb-3 p-2 bg-palette-beige rounded text-sm border border-palette-mauve/20">
                    <p className="text-palette-dark">
                      <strong>Watch Segment:</strong> {formatSecondsToTimestamp(assignment.segment_start_seconds)} - {formatSecondsToTimestamp(assignment.segment_end_seconds)} ({assignment.repeat_count || 1} times{assignment.pause_between_repeats_seconds > 0 ? `, ${assignment.pause_between_repeats_seconds}s pause` : ''})
                    </p>
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
                  className="w-full bg-palette-mauve text-white px-4 py-2 rounded hover:bg-palette-dark flex items-center justify-center gap-2"
                >
                  <FiPlay /> Watch Video
                </button>
              </div>
            </div>
          ))}
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
              >
                ×
              </button>
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
                <div className="flex items-center justify-between mb-3">
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
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedVideo.viewed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
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
                      This video will auto-play from {formatSecondsToTimestamp(selectedVideo.segment_start_seconds)} to {formatSecondsToTimestamp(selectedVideo.segment_end_seconds)} for {selectedVideo.repeat_count || 1} rounds{selectedVideo.pause_between_repeats_seconds > 0 ? ` with a ${selectedVideo.pause_between_repeats_seconds}-second pause between rounds` : ''}.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-palette-dark mb-2">About this video</h4>
                <p className="text-sm text-palette-dark/70">
                  {selectedVideo.video_details.description}
                </p>
              </div>

              {selectedVideo.viewed && selectedVideo.viewed_at && (
                <div className="text-sm text-palette-dark/60">
                  First viewed on {new Date(selectedVideo.viewed_at).toLocaleString()}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 text-sm font-medium text-palette-dark bg-palette-beige border border-palette-mauve/30 rounded-md hover:bg-palette-mauve/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
