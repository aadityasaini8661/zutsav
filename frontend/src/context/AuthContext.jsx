import React, { createContext, useContext, useState, useCallback } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('zutsav_user')); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const saveAuth = (token, userData) => {
    localStorage.setItem('zutsav_token', token);
    localStorage.setItem('zutsav_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = useCallback(async (emailOrPhone, password) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { emailOrPhone, password });
      saveAuth(data.token, data.user);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', payload);
      saveAuth(data.token, data.user);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerPandit = useCallback(async (formData) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register-pandit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      saveAuth(data.token, data.user);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('zutsav_token');
    localStorage.removeItem('zutsav_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await API.get('/auth/me');
      localStorage.setItem('zutsav_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch { logout(); }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, registerPandit, logout, refreshUser, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
