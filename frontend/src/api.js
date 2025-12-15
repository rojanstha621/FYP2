// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000", // Django server
});

// Attach JWT access token if available
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

export default api;
