// src/context/AuthContext.jsx
import React, { createContext, useContext, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem("access") || null
  );
  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem("refresh") || null
  );
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!accessToken;

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post("/account/login/", { email, password });
      const { access, refresh } = res.data;
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      setAccessToken(access);
      setRefreshToken(refresh);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.error || "Login failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      await api.post("/account/register/", formData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.detail ||
          "Registration failed. Please check your input.",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setAccessToken(null);
    setRefreshToken(null);
  };

  const value = {
    accessToken,
    refreshToken,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
