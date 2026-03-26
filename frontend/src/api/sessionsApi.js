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

export const getSessions = async () => {
  const response = await apiClient.get('/api/sessions/sessions/');
  return unwrapList(response);
};

export const createSession = async (data) => {
  const response = await apiClient.post('/api/sessions/sessions/', data);
  return unwrapItem(response);
};

export const completeSession = async (id, notes) => {
  const payload = notes ? { notes } : {};
  const response = await apiClient.post(`/api/sessions/sessions/${id}/complete/`, payload);
  return unwrapItem(response);
};

export const skipSession = async (id, notes) => {
  const payload = notes ? { notes } : {};
  const response = await apiClient.post(`/api/sessions/sessions/${id}/skip/`, payload);
  return unwrapItem(response);
};

export const logSet = async (sessionId, data) => {
  const response = await apiClient.post(`/api/sessions/sessions/${sessionId}/setlogs/`, data);
  return unwrapItem(response);
};

export const getSetLogs = async (sessionId) => {
  const response = await apiClient.get(`/api/sessions/sessions/${sessionId}/setlogs/`);
  return unwrapList(response);
};
