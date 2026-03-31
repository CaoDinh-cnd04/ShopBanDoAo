/**
 * Một biến FRONTEND_URL có thể chứa nhiều origin (phân tách bằng dấu phẩy hoặc chấm phẩy),
 * ví dụ: `http://localhost:5173,https://ndsports.id.vn`
 *
 * - NODE_ENV === 'production' → chọn URL không phải localhost (ưu tiên domain public).
 * - Ngược lại (dev) → ưu tiên localhost / 127.0.0.1 nếu có trong danh sách.
 */
export function resolveFrontendBase(
  raw: string | undefined,
  defaultWhenEmpty: string = 'http://localhost:5173',
): string {
  if (!raw?.trim()) return stripTrailingSlash(defaultWhenEmpty);

  const parts = raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return stripTrailingSlash(defaultWhenEmpty);
  if (parts.length === 1) return normalizeOrigin(parts[0]);

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const publicUrl = parts.find((p) => !isLocalhostUrl(p));
    return normalizeOrigin(publicUrl || parts[parts.length - 1]);
  }
  const local = parts.find((p) => isLocalhostUrl(p));
  return normalizeOrigin(local || parts[0]);
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/$/, '');
}

function normalizeOrigin(p: string): string {
  const t = p.trim();
  const withProto = t.startsWith('http') ? t : `https://${t}`;
  try {
    return new URL(withProto).origin;
  } catch {
    return stripTrailingSlash(t);
  }
}

function isLocalhostUrl(p: string): boolean {
  try {
    const withProto = p.startsWith('http') ? p : `https://${p}`;
    const h = new URL(withProto).hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch {
    return false;
  }
}
