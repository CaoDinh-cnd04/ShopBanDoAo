/** Khóa lưu phiên đăng nhập — dùng chung authSlice + interceptors */
export const AUTH_TOKEN_KEY = 'token';
export const AUTH_USER_KEY = 'user';

export function readToken() {
  const t = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!t || t === 'undefined') return null;
  return t;
}

export function readUserRaw() {
  const s = localStorage.getItem(AUTH_USER_KEY);
  if (!s || s === 'undefined') return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function persistSession(token, userObj) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userObj));
}

export function clearSessionStorage() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}
