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
  (response) => response,
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
};

// Admin API
export const adminAPI = {
  getUsers: () => apiClient.get('/api/account/users/'),
  getUser: (id) => apiClient.get(`/api/account/users/${id}/`),
  updateUser: (id, data) =>
    apiClient.patch(`/api/account/users/${id}/`, data),
  deleteUser: (id) =>
    apiClient.delete(`/api/account/users/${id}/`),
};

export default apiClient;
