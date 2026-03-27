import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — 401: logout + redirect (skip auth routes to avoid loop)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthRoute =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/google-login');
      if (!isAuthRoute) {
        store.dispatch(logout());
        const path = `${window.location.pathname}${window.location.search}`;
        const onLogin = path.startsWith('/login');
        if (!onLogin) {
          const returnUrl = encodeURIComponent(path);
          window.location.href = `/login?returnUrl=${returnUrl}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
