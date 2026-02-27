import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { exerciseAPI, videoAPI } from '../services/api';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';
import { FiPlay, FiCheckCircle, FiClock, FiUser } from 'react-icons/fi';

export default function ExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [targetAreaFilter, setTargetAreaFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_area: '',
    difficulty: 'MEDIUM',
    video_file: null,
    youtube_url: '',
    thumbnail: null,
    instructions: '',
    safety_notes: '',
  });

  const isTherapistOrAdmin = user?.role === 'THERAPIST' || user?.role === 'ADMIN';
  const isPatient = user?.role === 'PATIENT';

  useEffect(() => {
    fetchExercises();
    if (isPatient) {
      fetchVideos();
    }
  }, [searchTerm, targetAreaFilter, difficultyFilter]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (targetAreaFilter) params.target_area = targetAreaFilter;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      
      const response = await exerciseAPI.getExercises(params);
      setExercises(response.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exercises');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      
      const response = await videoAPI.getMyVideos(params);
      let videoList = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data?.data || []);
      
      setVideos(videoList);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
      // Don't set error for videos, just log it
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
    setShowVideoModal(true);
    
    // Mark as viewed if not already
    if (!video.viewed) {
      markAsViewed(video.id);
    }
  };

  const markAsViewed = async (videoId) => {
    try {
      await videoAPI.markVideoViewed(videoId);
      setSuccess('Marked as viewed');
      fetchVideos();
    } catch (err) {
      console.error('Failed to mark as viewed:', err);
    }
  };

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('target_area', formData.target_area);
      formDataToSend.append('difficulty', formData.difficulty);
      formDataToSend.append('instructions', formData.instructions);
      formDataToSend.append('safety_notes', formData.safety_notes);
      
      if (formData.video_file) {
        formDataToSend.append('video_file', formData.video_file);
      }
      if (formData.youtube_url) {
        formDataToSend.append('youtube_url', formData.youtube_url);
      }
      if (formData.thumbnail) {
        formDataToSend.append('thumbnail', formData.thumbnail);
      }

      await exerciseAPI.createExercise(formDataToSend);
      setSuccess('Exercise created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchExercises();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exercise');
    }
  };

  const handleUpdateExercise = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('target_area', formData.target_area);
      formDataToSend.append('difficulty', formData.difficulty);
      formDataToSend.append('instructions', formData.instructions);
      formDataToSend.append('safety_notes', formData.safety_notes);
      
      if (formData.video_file && typeof formData.video_file !== 'string') {
        formDataToSend.append('video_file', formData.video_file);
      }
      if (formData.youtube_url) {
        formDataToSend.append('youtube_url', formData.youtube_url);
      }
      if (formData.thumbnail && typeof formData.thumbnail !== 'string') {
        formDataToSend.append('thumbnail', formData.thumbnail);
      }

      await exerciseAPI.updateExercise(selectedExercise.id, formDataToSend);
      setSuccess('Exercise updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchExercises();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update exercise');
    }
  };

  const handleDeleteExercise = async (id) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    
    try {
      await exerciseAPI.deleteExercise(id);
      setSuccess('Exercise deleted successfully');
      fetchExercises();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete exercise');
    }
  };

  const handleViewDetails = (exercise) => {
    setSelectedExercise(exercise);
    setShowDetailModal(true);
  };

  const handleEditClick = (exercise) => {
    setSelectedExercise(exercise);
    setFormData({
      name: exercise.name,
      description: exercise.description,
      target_area: exercise.target_area,
      difficulty: exercise.difficulty,
      video_file: exercise.video_file,
      youtube_url: exercise.youtube_url || '',
      thumbnail: exercise.thumbnail,
      instructions: exercise.instructions || '',
      safety_notes: exercise.safety_notes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      target_area: '',
      difficulty: 'MEDIUM',
      video_file: null,
      youtube_url: '',
      thumbnail: null,
      instructions: '',
      safety_notes: '',
    });
    setSelectedExercise(null);
  };

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      EASY: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HARD: 'bg-red-100 text-red-800',
    };
    return colors[difficulty] || colors.MEDIUM;
  };

  return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-palette-dark">Exercise Library</h1>
          {isTherapistOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-palette-mauve text-white px-4 py-2 rounded-lg hover:bg-palette-dark"
            >
              Add Exercise
            </button>
          )}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        {/* Filters */}
        <div className="bg-palette-cream rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-palette-dark/80 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or description..."
                className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-palette-dark/80 mb-2">
                Target Area
              </label>
              <input
                type="text"
                value={targetAreaFilter}
                onChange={(e) => setTargetAreaFilter(e.target.value)}
                placeholder="e.g., Shoulder, Knee..."
                className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-palette-dark/80 mb-2">
                Difficulty
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
              >
                <option value="">All</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Combined Exercise and Video List */}
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Exercises */}
            {exercises.map((exercise) => (
              <div key={exercise.id} className="bg-palette-cream rounded-lg shadow overflow-hidden border-l-4 border-palette-mauve hover:shadow-lg transition-shadow">
                {exercise.thumbnail && (
                  <img
                    src={exercise.thumbnail}
                    alt={exercise.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2 text-palette-dark">{exercise.name}</h3>
                  <p className="text-palette-dark/70 mb-2 line-clamp-2">{exercise.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyBadge(exercise.difficulty)}`}>
                      {exercise.difficulty}
                    </span>
                    <span className="text-sm text-palette-dark/60">{exercise.target_area}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(exercise)}
                      className="flex-1 bg-palette-beige text-palette-dark/80 px-3 py-2 rounded hover:bg-palette-mauve/20"
                    >
                      View
                    </button>
                    {isTherapistOrAdmin && (
                      <>
                        <button
                          onClick={() => handleEditClick(exercise)}
                          className="bg-palette-blush text-palette-dark px-3 py-2 rounded hover:bg-palette-mauve/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="bg-red-50 text-red-700 px-3 py-2 rounded hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Assigned Videos - Only for Patients */}
            {isPatient && videos.map((assignment) => (
              <div key={`video-${assignment.id}`} className="bg-palette-cream rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-palette-blush">
                <div className="aspect-video bg-palette-cream/60 relative group cursor-pointer" onClick={() => handleViewVideo(assignment)}>
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
                    <div className="mb-3 p-2 bg-palette-blush/30 rounded text-sm">
                      <p className="text-palette-dark">
                        <strong>Therapist Note:</strong> {assignment.notes}
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
                    <FiPlay /> Watch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && exercises.length === 0 && (!isPatient || videos.length === 0) && (
          <div className="text-center py-12">
            <p className="text-palette-dark/60">No content found</p>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-palette-cream rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-4 text-palette-dark">Create Exercise</h2>
              <form onSubmit={handleCreateExercise}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Target Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.target_area}
                      onChange={(e) => setFormData({ ...formData, target_area: e.target.value })}
                      placeholder="e.g., Shoulder, Knee, Back"
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Difficulty *
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Video File
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setFormData({ ...formData, video_file: e.target.files[0] })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={formData.youtube_url}
                      onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                    <p className="text-xs text-palette-dark/60 mt-1">Either video file or YouTube URL is required</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Thumbnail
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files[0] })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Instructions
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Safety Notes
                    </label>
                    <textarea
                      value={formData.safety_notes}
                      onChange={(e) => setFormData({ ...formData, safety_notes: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-palette-mauve text-white px-4 py-2 rounded-lg hover:bg-palette-dark"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-palette-cream/60 text-palette-dark/80 px-4 py-2 rounded-lg hover:bg-palette-mauve/30"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedExercise && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-palette-cream rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-4 text-palette-dark">{selectedExercise.name}</h2>
              
              {selectedExercise.video_file && (
                <video controls className="w-full mb-4 rounded">
                  <source src={selectedExercise.video_file} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              
              {selectedExercise.youtube_url && !selectedExercise.video_file && (
                <div className="mb-4">
                  <iframe
                    width="100%"
                    height="400"
                    src={selectedExercise.youtube_url.replace('watch?v=', 'embed/')}
                    title={selectedExercise.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded"
                  ></iframe>
                </div>
              )}
              
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">Description:</span>
                  <p className="text-palette-dark/80">{selectedExercise.description}</p>
                </div>
                <div>
                  <span className="font-semibold">Target Area:</span>
                  <span className="text-palette-dark/80 ml-2">{selectedExercise.target_area}</span>
                </div>
                <div>
                  <span className="font-semibold">Difficulty:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getDifficultyBadge(selectedExercise.difficulty)}`}>
                    {selectedExercise.difficulty}
                  </span>
                </div>
                {selectedExercise.instructions && (
                  <div>
                    <span className="font-semibold">Instructions:</span>
                    <p className="text-palette-dark/80 whitespace-pre-wrap">{selectedExercise.instructions}</p>
                  </div>
                )}
                {selectedExercise.safety_notes && (
                  <div>
                    <span className="font-semibold">Safety Notes:</span>
                    <p className="text-palette-dark/80 whitespace-pre-wrap">{selectedExercise.safety_notes}</p>
                  </div>
                )}
                {selectedExercise.created_by_details && (
                  <div>
                    <span className="font-semibold">Created By:</span>
                    <span className="text-palette-dark/80 ml-2">
                      {selectedExercise.created_by_details.full_name} ({selectedExercise.created_by_details.role})
                    </span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full bg-palette-cream/60 text-palette-dark/80 px-4 py-2 rounded-lg hover:bg-palette-mauve/30 mt-6"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedExercise && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-palette-cream rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-4 text-palette-dark">Edit Exercise</h2>
              <form onSubmit={handleUpdateExercise}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Target Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.target_area}
                      onChange={(e) => setFormData({ ...formData, target_area: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Difficulty *
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Video File
                    </label>
                    {typeof formData.video_file === 'string' && (
                      <p className="text-sm text-palette-dark/70 mb-1">Current: {formData.video_file.split('/').pop()}</p>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setFormData({ ...formData, video_file: e.target.files[0] })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={formData.youtube_url}
                      onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Thumbnail
                    </label>
                    {typeof formData.thumbnail === 'string' && formData.thumbnail && (
                      <img src={formData.thumbnail} alt="Current thumbnail" className="w-32 h-32 object-cover mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files[0] })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Instructions
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-palette-dark/80 mb-1">
                      Safety Notes
                    </label>
                    <textarea
                      value={formData.safety_notes}
                      onChange={(e) => setFormData({ ...formData, safety_notes: e.target.value })}
                      className="w-full px-3 py-2 border border-palette-mauve rounded-md bg-palette-beige focus:outline-none focus:ring-2 focus:ring-palette-mauve"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-palette-mauve text-white px-4 py-2 rounded-lg hover:bg-palette-dark"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-palette-cream/60 text-palette-dark/80 px-4 py-2 rounded-lg hover:bg-palette-mauve/30"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Video Detail Modal */}
        {showVideoModal && selectedVideo && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-palette-cream">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-palette-dark">
                  {selectedVideo.video_details.title}
                </h3>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="text-palette-dark/50 hover:text-palette-dark/60 text-2xl"
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

                <div className="bg-palette-blush/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-palette-dark/70">Assigned by</p>
                      <p className="font-medium text-palette-dark">{selectedVideo.therapist_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-palette-dark/70">Assigned on</p>
                      <p className="font-medium text-palette-dark">
                        {new Date(selectedVideo.assigned_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-palette-dark/70">Status</p>
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
                    <div className="mt-3 p-3 bg-palette-blush/30 border-l-4 border-palette-mauve">
                      <p className="text-sm font-medium text-palette-dark mb-1">Therapist Instructions:</p>
                      <p className="text-sm text-palette-dark/80">{selectedVideo.notes}</p>
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
                  onClick={() => setShowVideoModal(false)}
                  className="px-6 py-2 text-sm font-medium text-palette-dark bg-palette-beige border border-palette-mauve rounded-md hover:bg-palette-mauve hover:text-white transition-colors"
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
