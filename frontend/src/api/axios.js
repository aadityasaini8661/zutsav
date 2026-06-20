import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://zutsav-production.up.railway.app/api',
  timeout: 15_000, // 15 s — prevents infinite loading on slow/dead connections
  withCredentials: true,
});

// Attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('zutsav_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handling
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      toast.error('Request timed out. Please check your connection and try again.', {
        id: 'timeout-error',
        duration: 6000,
      });
      return Promise.reject(err);
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('zutsav_token');
      localStorage.removeItem('zutsav_user');
      window.location.href = '/login';
    }
    if (err.response?.status === 429) {
      toast.error('Server is busy. Please wait a moment and try again.', {
        id: 'rate-limit',
        duration: 5000,
      });
    }
    return Promise.reject(err);
  }
);

export default API;
