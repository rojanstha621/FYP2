import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => {
    const payload = response?.data;

    // Transitional normalization: unwrap standardized success payloads.
    if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
      response.data = payload.data;
      return response;
    }

    if (payload?.success === false) {
      return Promise.reject({ response });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/account/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          apiClient.defaults.headers.common.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => apiClient.post('/api/account/register/', data),
  login: (email, password) =>
    apiClient.post('/api/account/login/', { email, password }),
  logout: (refreshToken) =>
    apiClient.post('/api/account/logout/', { refresh: refreshToken }),
  getMe: () => apiClient.get('/api/account/me/'),
  updateProfile: (data) => apiClient.patch('/api/account/me/', data),
  uploadProfilePicture: (formData) =>
    apiClient.patch('/api/account/me/profile-update/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  changePassword: (data) =>
    apiClient.post('/api/account/change-password/', data),
  // Patient dashboard
  getPatientDashboard: () =>
    apiClient.get('/api/account/dashboard/patient/'),
  getCareTeamDirectory: () => apiClient.get('/api/account/care-team/'),
};

// Medical History API
export const medicalAPI = {
  getMedicalHistories: () =>
    apiClient.get('/api/medicals/medical-history/'),
  getMedicalHistory: (id) =>
    apiClient.get(`/api/medicals/medical-history/${id}/`),
  createMedicalHistory: (data) =>
    apiClient.post('/api/medicals/medical-history/', data),
  updateMedicalHistory: (id, data) =>
    apiClient.patch(`/api/medicals/medical-history/${id}/`, data),
  deleteMedicalHistory: (id) =>
    apiClient.delete(`/api/medicals/medical-history/${id}/`),
};

export const nurseAPI = {
  getDirectory: () => apiClient.get('/api/account/care-team/'),
  // Nurse-patient assignments
  getAssignments: () => apiClient.get('/api/medicals/nurse-assignments/'),
  createAssignment: (data) => apiClient.post('/api/medicals/nurse-assignments/', data),
  updateAssignment: (id, data) => apiClient.patch(`/api/medicals/nurse-assignments/${id}/`, data),
  deactivateAssignment: (id) => apiClient.delete(`/api/medicals/nurse-assignments/${id}/`),

  // Appointments
  getAppointments: () => apiClient.get('/api/medicals/appointments/'),
  createAppointment: (data) => apiClient.post('/api/medicals/appointments/', data),
  updateAppointment: (id, data) => apiClient.patch(`/api/medicals/appointments/${id}/`, data),
  cancelAppointment: (id) => apiClient.delete(`/api/medicals/appointments/${id}/`),
};

// Therapist-Patient Assignment API
export const assignmentAPI = {
  getAssignments: () =>
    apiClient.get('/api/medicals/assignments/'),
  getAssignment: (id) =>
    apiClient.get(`/api/medicals/assignments/${id}/`),
  createAssignment: (data) =>
    apiClient.post('/api/medicals/assignments/', data),
  updateAssignment: (id, data) =>
    apiClient.patch(`/api/medicals/assignments/${id}/`, data),
  deleteAssignment: (id) =>
    apiClient.delete(`/api/medicals/assignments/${id}/`),
  requestAssignment: (therapistId) =>
    apiClient.post('/api/medicals/assignments/request/', { therapist_id: therapistId }),
  getPending: (params) =>
    apiClient.get('/api/medicals/assignments/pending/', { params }),
  activateAssignment: (id) =>
    apiClient.patch(`/api/medicals/assignments/${id}/activate/`),
  rejectAssignment: (id) =>
    apiClient.delete(`/api/medicals/assignments/${id}/reject/`),
};

// Admin API
export const adminAPI = {
  getUsers: (params) => apiClient.get('/api/account/users/', { params }),
  getUser: (id) => apiClient.get(`/api/account/users/${id}/`),
  updateUser: (id, data) =>
    apiClient.patch(`/api/account/users/${id}/`, data),
  deleteUser: (id) =>
    apiClient.delete(`/api/account/users/${id}/`),
  getPendingTherapists: (params) => apiClient.get('/api/account/therapists/pending/', { params }),
  approveTherapist: (id) => apiClient.patch(`/api/account/therapists/${id}/approve/`),
  rejectTherapist: (id) => apiClient.patch(`/api/account/therapists/${id}/reject/`),
};

// Therapist Directory API
export const therapistAPI = {
  getApproved: (params) => apiClient.get('/api/account/therapists/approved/', { params }),
  getById: (id) => apiClient.get(`/api/account/therapists/${id}/`),
};

// Video API
export const videoAPI = {
  // Admin endpoints - full video management
  getVideos: (params) =>
    apiClient.get('/api/videos/videos/', { params }),
  getVideo: (id) =>
    apiClient.get(`/api/videos/videos/${id}/`),
  createVideo: (data) =>
    apiClient.post('/api/videos/videos/', data),
  updateVideo: (id, data) =>
    apiClient.patch(`/api/videos/videos/${id}/`, data),
  deleteVideo: (id) =>
    apiClient.delete(`/api/videos/videos/${id}/`),
  toggleVideoActive: (id) =>
    apiClient.post(`/api/videos/videos/${id}/toggle_active/`),
  
  // Therapist endpoints - browse active videos
  getActiveVideos: (params) =>
    apiClient.get('/api/videos/active-videos/', { params }),
  getActiveVideo: (id) =>
    apiClient.get(`/api/videos/active-videos/${id}/`),
  
  // Therapist endpoints - video assignments
  getAssignments: (params) =>
    apiClient.get('/api/videos/assignments/', { params }),
  getAssignment: (id) =>
    apiClient.get(`/api/videos/assignments/${id}/`),
  createAssignment: (data) =>
    apiClient.post('/api/videos/assignments/', data),
  updateAssignment: (id, data) =>
    apiClient.patch(`/api/videos/assignments/${id}/`, data),
  deleteAssignment: (id) =>
    apiClient.delete(`/api/videos/assignments/${id}/`),
  getMyAssignments: (params) =>
    apiClient.get('/api/videos/assignments/my_assignments/', { params }),
  getAssignmentsByPatient: () =>
    apiClient.get('/api/videos/assignments/by_patient/'),
  
  // Patient endpoints - view assigned videos
  getMyVideos: (params) =>
    apiClient.get('/api/videos/my-videos/', { params }),
  getMyVideo: (id) =>
    apiClient.get(`/api/videos/my-videos/${id}/`),
  markVideoViewed: (id) =>
    apiClient.post(`/api/videos/my-videos/${id}/mark_viewed/`),
  logVideoDifficulty: (id, data) =>
    apiClient.post(`/api/videos/my-videos/${id}/log_difficulty/`, data),
  getVideoStatistics: () =>
    apiClient.get('/api/videos/my-videos/statistics/'),

  // Therapist - per-assignment schedule progress
  getScheduleProgress: (assignmentId) =>
    apiClient.get(`/api/videos/assignments/${assignmentId}/schedule_progress/`),
};

export default apiClient;
