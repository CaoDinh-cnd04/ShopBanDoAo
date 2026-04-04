import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { getApiBaseUrl } from '../config/apiBase';

/** Khớp BrowserRouter basename (VITE_BASE) — tránh redirect /login → 404 trên GitHub Pages */
function getLoginPath() {
  const base = import.meta.env.BASE_URL || '/';
  const trimmed = base.replace(/\/$/, '') || '';
  return trimmed ? `${trimmed}/login` : '/login';
}

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15s — tránh request treo mãi trên mạng chậm
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token; FormData phải bỏ Content-Type để browser gắn boundary multipart
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData: bỏ mọi Content-Type để axios/trình duyệt gắn multipart + boundary
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const h = config.headers;
      if (h) {
        if (typeof h.delete === 'function') {
          h.delete('Content-Type');
          h.delete('content-type');
        }
        if (typeof h.set === 'function') {
          try {
            h.set('Content-Type', false);
          } catch {
            /* ignore */
          }
        }
        delete h['Content-Type'];
        delete h['content-type'];
        if (h.common) {
          delete h.common['Content-Type'];
          delete h.common['content-type'];
        }
      }
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
      // checkAuth dùng GET /auth/profile — token hết hạn/không khớp JWT_SECRET: để thunk tự xóa storage, không logout+redirect toàn cục
      if (error.config?.skipAuthRedirect) {
        return Promise.reject(error);
      }
      const isAuthRoute =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/google-auth-code');
      if (!isAuthRoute) {
        store.dispatch(logout());
        const path = `${window.location.pathname}${window.location.search}`;
        const loginPath = getLoginPath();
        const onLogin =
          path === loginPath || path.startsWith(`${loginPath}?`);
        if (!onLogin) {
          const returnUrl = encodeURIComponent(path);
          window.location.href = `${loginPath}?returnUrl=${returnUrl}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
