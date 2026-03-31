/**
 * Base URL API — luôn kết thúc bằng /api (Nest route dạng /api/auth/login).
 *
 * Production: nếu build thiếu VITE_API_BASE_URL, axios gọi cùng origin (ndsports.id.vn)
 * → không có route /auth/* → 404, không lưu DB. Dùng fallback API Render.
 * Nên vẫn set VITE_API_BASE_URL trên GitHub Variables khi đổi host.
 */
const DEFAULT_PRODUCTION_API = 'https://shopbandoao.onrender.com/api';

function normalizeApiRoot(raw) {
  let v = raw.trim().replace(/\/+$/, '');
  if (!/\/api$/i.test(v)) {
    v = `${v}/api`;
  }
  return v;
}

/** Tránh gọi /api lên chính domain tĩnh (GitHub Pages) → 404 register/google-login */
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
  if (fromEnv) {
    const normalized = normalizeApiRoot(fromEnv);
    if (import.meta.env.PROD && isSameHostAsBrowser(normalized)) {
      return DEFAULT_PRODUCTION_API;
    }
    return normalized;
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api';
  }
  if (import.meta.env.PROD) {
    return DEFAULT_PRODUCTION_API;
  }
  return '';
}
