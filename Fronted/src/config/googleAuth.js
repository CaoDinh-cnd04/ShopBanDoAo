/** Client ID Web từ Google Cloud Console — OAuth 2.0 Client (Web) */
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

export const isGoogleAuthConfigured = GOOGLE_CLIENT_ID.length > 0;

/**
 * Redirect URI — phải khớp chính xác mục "Authorized redirect URIs" trong Google Cloud.
 * Ví dụ: https://ndsports.id.vn/auth/google/callback
 *        http://localhost:5173/auth/google/callback
 */
export function getGoogleRedirectUri() {
  if (typeof window === 'undefined') return '';
  const base = import.meta.env.BASE_URL || '/';
  const trimmed = base.replace(/\/$/, '') || '';
  const path = `${trimmed}/auth/google/callback`;
  return `${window.location.origin}${path}`;
}

/**
 * Full-page OAuth2 (không iframe GSI → không còn COOP/postMessage từ client:364).
 * state: object { returnUrl?: string } — trả về sau khi đăng nhập.
 */
export function buildGoogleAuthorizationUrl(stateObj) {
  if (!GOOGLE_CLIENT_ID) return '';
  const redirectUri = getGoogleRedirectUri();
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
