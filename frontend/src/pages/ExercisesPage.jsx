import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { exerciseAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { Alert } from '../components/Alert';
import { Spinner } from '../components/Spinner';

export default function ExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
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
  const [selectedExercise, setSelectedExercise] = useState(null);
  
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

  useEffect(() => {
    fetchExercises();
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
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Exercise Library</h1>
          {isTherapistOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Exercise
            </button>
          )}
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Area
              </label>
              <input
                type="text"
                value={targetAreaFilter}
                onChange={(e) => setTargetAreaFilter(e.target.value)}
                placeholder="e.g., Shoulder, Knee..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="bg-white rounded-lg shadow overflow-hidden">
                {exercise.thumbnail && (
                  <img
                    src={exercise.thumbnail}
                    alt={exercise.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{exercise.name}</h3>
                  <p className="text-gray-600 mb-2 line-clamp-2">{exercise.description}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyBadge(exercise.difficulty)}`}>
                      {exercise.difficulty}
                    </span>
                    <span className="text-sm text-gray-500">{exercise.target_area}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(exercise)}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200"
                    >
                      View
                    </button>
                    {isTherapistOrAdmin && (
                      <>
                        <button
                          onClick={() => handleEditClick(exercise)}
                          className="bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(exercise.id)}
                          className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && exercises.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No exercises found</p>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-4">Create Exercise</h2>
              <form onSubmit={handleCreateExercise}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.target_area}
                      onChange={(e) => setFormData({ ...formData, target_area: e.target.value })}
                      placeholder="e.g., Shoulder, Knee, Back"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty *
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video File
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setFormData({ ...formData, video_file: e.target.files[0] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={formData.youtube_url}
                      onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">Either video file or YouTube URL is required</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thumbnail
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files[0] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Safety Notes
                    </label>
                    <textarea
                      value={formData.safety_notes}
                      onChange={(e) => setFormData({ ...formData, safety_notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
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
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedExercise.name}</h2>
              
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
                  <p className="text-gray-700">{selectedExercise.description}</p>
                </div>
                <div>
                  <span className="font-semibold">Target Area:</span>
                  <span className="text-gray-700 ml-2">{selectedExercise.target_area}</span>
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
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedExercise.instructions}</p>
                  </div>
                )}
                {selectedExercise.safety_notes && (
                  <div>
                    <span className="font-semibold">Safety Notes:</span>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedExercise.safety_notes}</p>
                  </div>
                )}
                {selectedExercise.created_by_details && (
                  <div>
                    <span className="font-semibold">Created By:</span>
                    <span className="text-gray-700 ml-2">
                      {selectedExercise.created_by_details.full_name} ({selectedExercise.created_by_details.role})
                    </span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 mt-6"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedExercise && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-2xl font-bold mb-4">Edit Exercise</h2>
              <form onSubmit={handleUpdateExercise}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.target_area}
                      onChange={(e) => setFormData({ ...formData, target_area: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty *
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Video File
                    </label>
                    {typeof formData.video_file === 'string' && (
                      <p className="text-sm text-gray-600 mb-1">Current: {formData.video_file.split('/').pop()}</p>
                    )}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setFormData({ ...formData, video_file: e.target.files[0] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={formData.youtube_url}
                      onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thumbnail
                    </label>
                    {typeof formData.thumbnail === 'string' && formData.thumbnail && (
                      <img src={formData.thumbnail} alt="Current thumbnail" className="w-32 h-32 object-cover mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.files[0] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Safety Notes
                    </label>
                    <textarea
                      value={formData.safety_notes}
                      onChange={(e) => setFormData({ ...formData, safety_notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
