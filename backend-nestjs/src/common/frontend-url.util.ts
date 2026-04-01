/**
 * Một biến FRONTEND_URL có thể chứa nhiều origin (phân tách bằng dấu phẩy hoặc chấm phẩy),
 * ví dụ: `http://localhost:5173,https://ndsports.id.vn`
 *
 * - Production (NODE_ENV=production hoặc Render RENDER=true, …) → không redirect về localhost.
 * - Dev → ưu tiên localhost / 127.0.0.1 nếu có trong danh sách.
 *
 * Khi FRONTEND_URL rỗng hoặc chỉ localhost trong production: không redirect VNPay về localhost.
 * Gợi ý Render: đặt FRONTEND_URL=https://ndsports.id.vn hoặc FRONTEND_PUBLIC_URL cùng domain.
 */

/** Domain public mặc định (có thể ghi đè bằng FRONTEND_PUBLIC_URL trên server). */
const DEFAULT_PUBLIC_SITE = 'https://ndsports.id.vn';

/**
 * Một số host (Render, Railway…) không set NODE_ENV=production đúng cách → redirect VNPay
 * về localhost nếu chỉ dựa vào NODE_ENV. Coi các môi trường này là «production» cho URL public.
 */
export function isProductionDeployment(): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  if (process.env.RENDER === 'true') return true;
  if (process.env.RAILWAY_ENVIRONMENT === 'production') return true;
  return false;
}

function implicitDefaultWhenEmpty(): string {
  if (isProductionDeployment()) {
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
    if (isProductionDeployment() && isLocalhostUrl(p)) {
      return emptyDefault;
    }
    return normalizeOrigin(p);
  }

  if (isProductionDeployment()) {
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
