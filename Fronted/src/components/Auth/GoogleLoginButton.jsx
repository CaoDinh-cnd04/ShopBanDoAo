import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { googleIdTokenLogin } from '../../store/slices/authSlice';

/**
 * Đăng nhập Google qua JWT credential (Sign In With Google) — không dùng popup OAuth,
 * tránh Cross-Origin-Opener-Policy / window.closed trên GitHub Pages.
 */
const GoogleLoginButton = ({ onSuccess, disabled }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse) => {
    const cred = credentialResponse?.credential;
    if (!cred) {
      toast.error('Không nhận được token từ Google. Thử lại.');
      return;
    }
    try {
      setLoading(true);
      const res = await dispatch(googleIdTokenLogin(cred));

      if (!googleIdTokenLogin.fulfilled.match(res)) {
        toast.error(res.payload || 'Đăng nhập Google thất bại');
        return;
      }

      toast.success('Đăng nhập Google thành công! 🎉');
      onSuccess?.(res);
    } catch {
      toast.error('Lỗi đăng nhập Google');
    } finally {
      setLoading(false);
    }
  };

  const busy = disabled || loading;

  return (
    <div className={`auth-google-btn-wrap ${busy ? 'auth-google-btn-wrap--busy' : ''}`}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error('Đăng nhập Google thất bại')}
        text="continue_with"
        shape="rectangular"
        size="large"
        width="100%"
        theme="outline"
        locale="vi"
        containerProps={{ className: 'auth-google-btn-inner' }}
      />
      {loading ? (
        <span className="auth-google-loading" aria-hidden>
          <span className="auth-spinner dark" />
        </span>
      ) : null}
    </div>
  );
};

export default GoogleLoginButton;
