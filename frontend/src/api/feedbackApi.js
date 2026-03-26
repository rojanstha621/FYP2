import apiClient from '../services/api';

const unwrapList = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return { items: data, unreadCount: 0 };
  if (Array.isArray(data?.results)) return { items: data.results, unreadCount: data.unread_count || 0 };
  if (Array.isArray(data?.result)) return { items: data.result, unreadCount: data.unread_count || 0 };
  return { items: [], unreadCount: data?.unread_count || 0 };
};

const unwrapItem = (response) => {
  const data = response?.data;
  return data?.result || data;
};

export const getFeedback = async () => {
  const response = await apiClient.get('/api/feedback/feedback/');
  return unwrapList(response);
};

export const sendFeedback = async (data) => {
  const response = await apiClient.post('/api/feedback/feedback/', data);
  return unwrapItem(response);
};

export const markRead = async (id) => {
  const response = await apiClient.post(`/api/feedback/feedback/${id}/mark_read/`);
  return unwrapItem(response);
};

export const getUnreadCount = async () => {
  const response = await apiClient.get('/api/feedback/feedback/unread_count/');
  const data = response?.data;
  return Number(data?.unread_count || 0);
};
