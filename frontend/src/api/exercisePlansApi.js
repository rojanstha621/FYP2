import apiClient from '../services/api';

const unwrapList = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const unwrapItem = (response) => {
  const data = response?.data;
  return data?.result || data;
};

export const getExercisePlans = async (params = {}) => {
  const response = await apiClient.get('/api/exercises/exercise-plans/', { params });
  return unwrapList(response);
};

export const getExercisePlan = async (id) => {
  const response = await apiClient.get(`/api/exercises/exercise-plans/${id}/`);
  return unwrapItem(response);
};

export const createExercisePlan = async (payload) => {
  const response = await apiClient.post('/api/exercises/exercise-plans/', payload);
  return unwrapItem(response);
};

export const updateExercisePlan = async (id, payload) => {
  const response = await apiClient.patch(`/api/exercises/exercise-plans/${id}/`, payload);
  return unwrapItem(response);
};

export const deleteExercisePlan = async (id) => {
  await apiClient.delete(`/api/exercises/exercise-plans/${id}/`);
};

export const toggleExercisePlanActive = async (id) => {
  const response = await apiClient.post(`/api/exercises/exercise-plans/${id}/toggle_active/`);
  return unwrapItem(response);
};

export const getExercisesForPlans = async () => {
  const response = await apiClient.get('/api/exercises/exercises/', {
    params: { is_active: true },
  });
  return unwrapList(response);
};

export const getTherapistAssignments = async () => {
  const response = await apiClient.get('/api/medicals/assignments/');
  return unwrapList(response);
};
