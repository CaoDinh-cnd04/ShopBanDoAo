/** Chuẩn hóa URL ảnh từ API (/uploads/...) sang origin backend (dev: qua Vite proxy). */
export function resolveMediaUrl(url) {
  if (url == null || url === '') return '';
  const s = String(url).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return s;
  return `/${s.replace(/^\/+/, '')}`;
}
