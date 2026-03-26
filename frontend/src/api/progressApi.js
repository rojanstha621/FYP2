import apiClient from '../services/api';

const unwrapItem = (response) => {
  const data = response?.data;
  return data?.result || data;
};

const buildParams = (base = {}, key, value) => {
  const params = { ...base };
  if (value) params[key] = value;
  return params;
};

export const getDailyProgress = async (date, patientId) => {
  let params = buildParams({}, 'date', date);
  params = buildParams(params, 'patient_id', patientId);
  const response = await apiClient.get('/api/progress/daily/', { params });
  return unwrapItem(response);
};

export const getWeeklyProgress = async (weekStart, patientId) => {
  let params = buildParams({}, 'week_start', weekStart);
  params = buildParams(params, 'patient_id', patientId);
  const response = await apiClient.get('/api/progress/weekly/', { params });
  return unwrapItem(response);
};

export const getProgressSummary = async (patientId) => {
  const params = buildParams({}, 'patient_id', patientId);
  const response = await apiClient.get('/api/progress/summary/', { params });
  return unwrapItem(response);
};

export const getTherapistOverview = async () => {
  const response = await apiClient.get('/api/progress/therapist-overview/');
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};
