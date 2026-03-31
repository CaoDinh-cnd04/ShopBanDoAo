/**
 * Base URL API — luôn là URL tuyệt đối https://.../api trong production.
 *
 * Lỗi thường gặp: VITE_API_BASE_URL = `/api` hoặc trùng domain site tĩnh (GitHub Pages)
 * → axios gọi nhầm ndsports.id.vn/api → 404 login/register.
 * Hoặc build cũ vẫn gọi /auth/google-login — dùng google-id-token + GOOGLE_CLIENT_ID trên Render.
 */
const DEFAULT_PRODUCTION_API = 'https://shopbandoao.onrender.com/api';

function normalizeAbsoluteApiRoot(raw) {
  const v = raw.trim().replace(/\/+$/, '');
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) {
    return v;
  }
  if (!/\/api$/i.test(v)) {
    return `${v}/api`;
  }
  return v;
}

function isSameHostAsBrowser(apiRoot) {
  if (typeof window === 'undefined') return false;
  try {
    return new URL(apiRoot).hostname === window.location.hostname;
  } catch {
    return false;
  }
}

export function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();

  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api';
  }

  if (import.meta.env.PROD) {
    // URL tương đối (/api, ...) — không dùng được làm baseURL axios (sẽ gọi vào domain tĩnh)
    if (fromEnv && (fromEnv.startsWith('/') || /^api\/?$/i.test(fromEnv))) {
      return DEFAULT_PRODUCTION_API;
    }
    if (!fromEnv) {
      return DEFAULT_PRODUCTION_API;
    }
    const normalized = normalizeAbsoluteApiRoot(fromEnv);
    if (!normalized.startsWith('http')) {
      return DEFAULT_PRODUCTION_API;
    }
    if (isSameHostAsBrowser(normalized)) {
      return DEFAULT_PRODUCTION_API;
    }
    return normalized;
  }

  return fromEnv ? normalizeAbsoluteApiRoot(fromEnv) : '';
}

/** Origin backend (uploads, ảnh) — không có /api */
export function getApiOrigin() {
  const base = getApiBaseUrl();
  if (!base) return '';
  return base.replace(/\/api\/?$/, '');
}
