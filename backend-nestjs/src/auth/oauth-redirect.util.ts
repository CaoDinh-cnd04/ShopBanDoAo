/**
 * Chuẩn hóa redirect_uri gửi lên Google (tránh lệch do % encoding hoặc / thừa cuối path).
 */
export function normalizeOAuthRedirectUri(raw: string): string {
  let v = raw.trim();
  try {
    if (/%[0-9A-Fa-f]{2}/.test(v)) {
      v = decodeURIComponent(v);
    }
  } catch {
    /* giữ nguyên */
  }
  try {
    const u = new URL(v);
    let path = u.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.replace(/\/+$/, '');
    }
    return `${u.origin}${path}${u.search}${u.hash}`;
  } catch {
    return v;
  }
}
