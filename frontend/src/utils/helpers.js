// Utility functions for common operations

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const getRoleColor = (role) => {
  const colors = {
    ADMIN: 'bg-palette-blush text-palette-dark border-palette-mauve',
    PATIENT: 'bg-palette-cream text-palette-dark border-palette-beige',
    THERAPIST: 'bg-palette-cream text-palette-dark border-palette-beige',
  };
  return colors[role] || 'bg-palette-cream text-palette-dark border-palette-cream/40';
};

export const getRoleLabel = (role) => {
  const labels = {
    ADMIN: 'Administrator',
    PATIENT: 'Patient',
    THERAPIST: 'Therapist',
  };
  return labels[role] || role;
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const parseError = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-palette-blush text-palette-dark',
    inactive: 'bg-palette-mauve/20 text-palette-dark',
    pending: 'bg-palette-cream text-palette-dark',
    completed: 'bg-palette-cream text-palette-dark',
  };
  return colors[status] || 'bg-palette-cream text-palette-dark';
};

export const calculateDaysSince = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffTime = Math.abs(now - then);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getPainLevelLabel = (level) => {
  if (level <= 2) return 'No pain';
  if (level <= 4) return 'Mild pain';
  if (level <= 6) return 'Moderate pain';
  if (level <= 8) return 'Severe pain';
  return 'Extreme pain';
};

export const getDifficultyLabel = (level) => {
  if (level <= 2) return 'Very Easy';
  if (level <= 4) return 'Easy';
  if (level <= 6) return 'Moderate';
  if (level <= 8) return 'Hard';
  return 'Very Hard';
};
