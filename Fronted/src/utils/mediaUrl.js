import { getApiOrigin } from '../config/apiBase';

/**
 * Chuẩn hóa URL trả về từ API upload để lưu vào MongoDB:
 * - Luôn lưu dạng `/uploads/...` (tương đối) thay vì `http://localhost:3000/uploads/...`
 *   → mọi môi trường (dev/prod) đều resolve qua `resolveMediaUrl` + `VITE_API_ORIGIN` đúng.
 * - Từ chối blob:/data: (không bền sau khi đóng tab).
 * - URL ngoài (CDN) giữ nguyên chuỗi đầy đủ.
 */
export function normalizeUploadUrlForDb(url) {
  if (url == null || url === '') return '';
  const s = String(url).trim();
  if (s.startsWith('blob:') || s.startsWith('data:')) return '';
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      if (u.pathname.includes('/uploads/')) {
        return `${u.pathname}${u.search}${u.hash}`;
      }
      return s;
    }
  } catch {
    return s;
  }
  return s.startsWith('/') ? s : `/${s}`;
}

/**
 * Chuẩn hóa URL ảnh từ API / DB:
 * - URL tuyệt đối https://... — giữ nguyên (trừ localhost → gắn lại origin API)
 * - `/uploads/...` — gắn origin backend (VITE_API_ORIGIN hoặc getApiOrigin)
 * - URL dev cũ `http://localhost:3000/uploads/...` — đổi sang domain API production
 */
export function resolveMediaUrl(url) {
  if (url == null || url === '') return '';
  if (typeof url === 'object' && url !== null && url.imageUrl != null) {
    return resolveMediaUrl(url.imageUrl);
  }
  const s = String(url).trim();
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      const host = u.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '[::1]'
      ) {
        const path = `${u.pathname}${u.search}${u.hash}`;
        return resolveMediaUrl(path);
      }
    } catch {
      /* ignore */
    }
    return s;
  }
  const path = s.startsWith('/') ? s : `/${s}`;
  const rawBase =
    import.meta.env.VITE_API_ORIGIN?.trim() || getApiOrigin();
  if (rawBase && path.startsWith('/uploads')) {
    return `${String(rawBase).replace(/\/$/, '')}${path}`;
  }
  return path;
}
