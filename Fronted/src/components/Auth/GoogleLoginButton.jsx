import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  buildGoogleAuthorizationUrl,
  isGoogleAuthConfigured,
} from '../../config/googleAuth';
import { IN_APP_GOOGLE_HINT, isInAppBrowser } from '../../utils/inAppBrowser';

/**
 * Đăng nhập Google bằng OAuth2 redirect (full page) — không dùng GSI iframe,
 * tránh Cross-Origin-Opener-Policy / postMessage (client:364) trên mọi máy.
 * Backend đổi code → JWT (cần GOOGLE_CLIENT_SECRET trên Render).
 *
 * @param {string} [returnUrl] — sau khi đăng nhập (query returnUrl từ /login)
 */
const GoogleLoginButton = ({ returnUrl, disabled }) => {
  const { t } = useTranslation();

  const handleClick = () => {
    if (isInAppBrowser()) {
      toast.error(IN_APP_GOOGLE_HINT, { autoClose: 12000 });
      return;
    }
    if (!isGoogleAuthConfigured) {
      toast.error(t('auth.googleNotConfigured'));
      return;
    }
    const url = buildGoogleAuthorizationUrl({
      returnUrl: returnUrl || '',
    });
    if (!url) {
      toast.error(t('auth.googleLinkFailed'));
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
      <FcGoogle size={20} /> {t('auth.loginWithGoogle')}
    </button>
  );
};

export default GoogleLoginButton;
