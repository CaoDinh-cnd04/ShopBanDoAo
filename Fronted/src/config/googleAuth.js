/** Client ID Web từ Google Cloud Console — bắt buộc để bật nút Đăng nhập Google */
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

export const isGoogleAuthConfigured = GOOGLE_CLIENT_ID.length > 0;
