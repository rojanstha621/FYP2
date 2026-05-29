import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { AuthContext } from './authContextInstance.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (typeof value !== 'string') return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

const buildUserWithProfile = (payload) => {
  const user = payload?.user || null;
  if (!user) return null;

  return {
    ...user,
    profile_picture: resolveMediaUrl(payload?.profile?.profile_picture),
  };
};

const extractErrorMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (!data) return fallback;

  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (data.message) return data.message;

  const firstValue = Object.values(data).find((value) => value);
  if (Array.isArray(firstValue) && firstValue.length > 0) {
    return firstValue[0];
  }
  if (typeof firstValue === 'string') return firstValue;

  return fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await authAPI.getMe();
      const payload = response.data?.result || response.data;
      // Store flattened user + profile picture for avatar rendering.
      const currentUser = buildUserWithProfile(payload);
      setUser(currentUser);
      setError(null);
      return currentUser;
    } catch (err) {
      console.error('Failed to fetch user:', err);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      const payload = response.data?.result || response.data;
      const { access, refresh } = payload || {};

      if (!access || !refresh) {
        throw new Error('Missing auth tokens in login response');
      }

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      return await fetchCurrentUser();
    } catch (err) {
      const message = extractErrorMessage(err, 'Login failed');
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await authAPI.register(data);
      return true;
    } catch (err) {
      const message = extractErrorMessage(err, 'Registration failed');
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (err) {
      console.error('Logout API call failed:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const payload = response.data?.result || response.data;
      setUser(buildUserWithProfile(payload));
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to update profile');
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
