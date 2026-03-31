/**
 * Base URL API — luôn kết thúc bằng /api (Nest route dạng /api/products).
 * Nếu biến chỉ là https://host (thiếu /api), tự nối để tránh 404.
 */
export function getApiBaseUrl() {
  let v = import.meta.env.VITE_API_BASE_URL?.trim();
  if (v) {
    v = v.replace(/\/+$/, '');
    if (!/\/api$/i.test(v)) {
      v = `${v}/api`;
    }
    return v;
  }
  if (import.meta.env.DEV) return 'http://localhost:3000/api';
  return '';
}
