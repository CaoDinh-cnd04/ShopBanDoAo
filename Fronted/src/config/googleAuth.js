/** Client ID Web từ Google Cloud Console — OAuth 2.0 Client (Web) */
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

export const isGoogleAuthConfigured = GOOGLE_CLIENT_ID.length > 0;

/** Khớp với key trong AuthGoogleCallback — đổi token phải dùng đúng redirect_uri lúc authorize */
const SESSION_OAUTH_REDIRECT = 'google_oauth_redirect_uri';

/** Khớp backend `normalizeOAuthRedirectUri` — tránh lệch token exchange (400). */
function normalizeOAuthRedirectUri(url) {
  let v = String(url).trim();
  try {
    if (/%[0-9A-Fa-f]{2}/.test(v)) {
      v = decodeURIComponent(v);
    }
  } catch {
    /* ignore */
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

/**
 * Redirect URI — phải khớp chính xác mục "Authorized redirect URIs" trong Google Cloud.
 * Ví dụ: https://ndsports.id.vn/auth/google/callback
 *        http://localhost:5173/auth/google/callback
 *
 * Khi deploy GitHub Pages với VITE_BASE=/TênRepo/, callback thực tế là
 * https://…github.io/TênRepo/auth/google/callback — phải khai báo ĐỦ trong Console.
 * Hoặc set VITE_GOOGLE_REDIRECT_URI (URL đầy đủ) để khớp bắt buộc với Console.
 */
export function getGoogleRedirectUri() {
  if (typeof window === 'undefined') return '';
  const explicit = (import.meta.env.VITE_GOOGLE_REDIRECT_URI || '').trim();
  if (explicit) {
    return normalizeOAuthRedirectUri(explicit);
  }
  const base = import.meta.env.BASE_URL || '/';
  const trimmed = base.replace(/\/$/, '') || '';
  const path = `${trimmed}/auth/google/callback`;
  return normalizeOAuthRedirectUri(`${window.location.origin}${path}`);
}

/** Dùng cùng redirect_uri đã lưu khi bấm «Đăng nhập Google» — tránh lệch authorize vs exchange. */
export function getGoogleRedirectUriForCodeExchange() {
  if (typeof window === 'undefined') return '';
  try {
    const stored = sessionStorage.getItem(SESSION_OAUTH_REDIRECT)?.trim();
    if (stored) return normalizeOAuthRedirectUri(stored);
  } catch {
    /* ignore */
  }
  return getGoogleRedirectUri();
}

export function clearStoredGoogleOAuthRedirectUri() {
  try {
    sessionStorage.removeItem(SESSION_OAUTH_REDIRECT);
  } catch {
    /* ignore */
  }
}

/**
 * Full-page OAuth2 (không iframe GSI → không còn COOP/postMessage từ client:364).
 * state: object { returnUrl?: string } — trả về sau khi đăng nhập.
 */
export function buildGoogleAuthorizationUrl(stateObj) {
  if (!GOOGLE_CLIENT_ID) return '';
  const redirectUri = getGoogleRedirectUri();
  try {
    sessionStorage.setItem(SESSION_OAUTH_REDIRECT, redirectUri);
  } catch {
    /* ignore */
  }
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    access_type: 'offline',
  });
  if (stateObj != null && typeof stateObj === 'object') {
    try {
      const s = JSON.stringify(stateObj);
      params.set('state', btoa(unescape(encodeURIComponent(s))));
    } catch {
      /* ignore */
    }
  }
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Giải state từ query (callback) */
export function parseGoogleOAuthState(stateParam) {
  if (!stateParam || typeof stateParam !== 'string') return {};
  try {
    const json = decodeURIComponent(escape(atob(stateParam)));
    return JSON.parse(json);
  } catch {
    return {};
  }
}
