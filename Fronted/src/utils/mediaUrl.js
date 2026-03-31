import { getApiOrigin } from '../config/apiBase';

/**
 * Chuẩn hóa URL ảnh từ API:
 * - Đường dẫn tuyệt đối https://... giữ nguyên
 * - `/uploads/...` — gắn origin backend (getApiOrigin + VITE_API_ORIGIN override)
 * - Ngược lại giữ path tương đối (dev: Vite proxy `/uploads` → backend)
 */
export function resolveMediaUrl(url) {
  if (url == null || url === '') return '';
  if (typeof url === 'object' && url !== null && url.imageUrl != null) {
    return resolveMediaUrl(url.imageUrl);
  }
  const s = String(url).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith('/') ? s : `/${s}`;
  const rawBase =
    import.meta.env.VITE_API_ORIGIN?.trim() || getApiOrigin();
  if (rawBase && path.startsWith('/uploads')) {
    return `${String(rawBase).replace(/\/$/, '')}${path}`;
  }
  return path;
}
