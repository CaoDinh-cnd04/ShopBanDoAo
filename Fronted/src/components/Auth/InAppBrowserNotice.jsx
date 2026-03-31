import { isInAppBrowser } from '../../utils/inAppBrowser';

/** Cảnh báo khi mở site trong app Facebook/Messenger — Google OAuth bị chặn */
export default function InAppBrowserNotice() {
  if (!isInAppBrowser()) return null;
  return (
    <div className="auth-inapp-notice" role="status">
      <strong>Đăng nhập Google:</strong> bạn đang dùng trình duyệt trong app (Messenger/Facebook…). Google
      chặn đăng nhập ở đây. Vui lòng mở menu <strong>⋮</strong> → <strong>Mở bằng Chrome/Safari</strong>, sau đó
      thử lại.
    </div>
  );
}
