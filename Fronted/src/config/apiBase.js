/**
 * Base URL API (thường kết thúc bằng /api).
 * Production: bắt buộc set VITE_API_BASE_URL lúc build (GitHub Variables).
 */
export function getApiBaseUrl() {
  const v = import.meta.env.VITE_API_BASE_URL?.trim();
  if (v) return v;
  if (import.meta.env.DEV) return 'http://localhost:3000/api';
  return '';
}
