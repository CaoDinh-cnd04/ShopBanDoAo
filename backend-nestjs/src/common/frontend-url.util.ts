/**
 * Một biến FRONTEND_URL có thể chứa nhiều origin (phân tách bằng dấu phẩy hoặc chấm phẩy),
 * ví dụ: `http://localhost:5173,https://ndsports.id.vn`
 *
 * - NODE_ENV === 'production' → chọn URL không phải localhost (ưu tiên domain public).
 * - Ngược lại (dev) → ưu tiên localhost / 127.0.0.1 nếu có trong danh sách.
 *
 * Khi FRONTEND_URL rỗng hoặc chỉ localhost trong production: không redirect VNPay về localhost.
 * Gợi ý Render: đặt FRONTEND_URL=https://ndsports.id.vn hoặc FRONTEND_PUBLIC_URL cùng domain.
 */

/** Domain public mặc định (có thể ghi đè bằng FRONTEND_PUBLIC_URL trên server). */
const DEFAULT_PUBLIC_SITE = 'https://ndsports.id.vn';

function implicitDefaultWhenEmpty(): string {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    return (
      process.env.FRONTEND_PUBLIC_URL?.trim() ||
      process.env.FRONTEND_URL_FALLBACK?.trim() ||
      DEFAULT_PUBLIC_SITE
    );
  }
  return 'http://localhost:5173';
}

export function resolveFrontendBase(
  raw: string | undefined,
  defaultWhenEmpty?: string,
): string {
  const emptyDefault = stripTrailingSlash(
    defaultWhenEmpty ?? implicitDefaultWhenEmpty(),
  );

  if (!raw?.trim()) return emptyDefault;

  const parts = raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return emptyDefault;
  if (parts.length === 1) {
    const p = parts[0];
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && isLocalhostUrl(p)) {
      return emptyDefault;
    }
    return normalizeOrigin(p);
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const publicUrl = parts.find((pr) => !isLocalhostUrl(pr));
    return normalizeOrigin(publicUrl || parts[parts.length - 1]);
  }
  const local = parts.find((pr) => isLocalhostUrl(pr));
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
