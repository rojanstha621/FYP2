import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { videoAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { FiPlay, FiCheckCircle, FiClock, FiUser } from 'react-icons/fi';

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
        <h1 className="text-3xl font-bold text-gray-900">My Educational Videos</h1>
        <p className="text-gray-600 mt-2">Videos assigned to you by your therapist</p>
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <FiPlay className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Assigned</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.total_assigned}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <FiCheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Viewed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.total_viewed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <FiClock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unviewed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.total_unviewed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <FiCheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completion</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {statistics.completion_rate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FiPlay className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No videos assigned yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your therapist hasn't assigned any videos to you yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-200 relative group cursor-pointer" onClick={() => handleViewVideo(assignment)}>
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
                <h3 className="font-semibold text-gray-900 mb-2">
                  {assignment.video_details.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {assignment.video_details.description}
                </p>
                
                {assignment.notes && (
                  <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
                    <p className="text-blue-900">
                      <strong>Therapist Note:</strong> {assignment.notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <FiUser className="text-xs" />
                    <span>{assignment.therapist_name}</span>
                  </div>
                  <span>{new Date(assignment.assigned_at).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => handleViewVideo(assignment)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedVideo.video_details.title}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-500 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="aspect-video w-full bg-gray-900 rounded-lg overflow-hidden">
                <iframe
                  src={selectedVideo.video_details.youtube_embed_url}
                  title={selectedVideo.video_details.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Assigned by</p>
                    <p className="font-medium text-gray-900">{selectedVideo.therapist_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assigned on</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedVideo.assigned_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
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
                  <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-blue-900 mb-1">Therapist Instructions:</p>
                    <p className="text-sm text-blue-800">{selectedVideo.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">About this video</h4>
                <p className="text-sm text-gray-600">
                  {selectedVideo.video_details.description}
                </p>
              </div>

              {selectedVideo.viewed && selectedVideo.viewed_at && (
                <div className="text-sm text-gray-500">
                  First viewed on {new Date(selectedVideo.viewed_at).toLocaleString()}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
