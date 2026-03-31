import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';
import {
  buildGoogleAuthorizationUrl,
  isGoogleAuthConfigured,
} from '../../config/googleAuth';

/**
 * Đăng nhập Google bằng OAuth2 redirect (full page) — không dùng GSI iframe,
 * tránh Cross-Origin-Opener-Policy / postMessage (client:364) trên mọi máy.
 * Backend đổi code → JWT (cần GOOGLE_CLIENT_SECRET trên Render).
 *
 * @param {string} [returnUrl] — sau khi đăng nhập (query returnUrl từ /login)
 */
const GoogleLoginButton = ({ returnUrl, disabled }) => {
  const handleClick = () => {
    if (!isGoogleAuthConfigured) {
      toast.error('Chưa cấu hình Google Client ID');
      return;
    }
    const url = buildGoogleAuthorizationUrl({
      returnUrl: returnUrl || '',
    });
    if (!url) {
      toast.error('Không tạo được link Google');
      return;
    }
    window.location.href = url;
  };

  return (
    <button
      type="button"
      className="auth-google-btn"
      onClick={handleClick}
      disabled={disabled}
    >
      <FcGoogle size={20} /> Đăng nhập với Google
    </button>
  );
};

export default GoogleLoginButton;
