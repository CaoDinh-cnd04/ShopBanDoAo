import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';
import { googleLogin } from '../../store/slices/authSlice';

/**
 * Nút đăng nhập Google.
 * Backend tự tạo tài khoản nếu email chưa tồn tại → luôn trả { token, user }.
 */
const GoogleLoginButton = ({ onSuccess, disabled }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleGoogle = useGoogleLogin({
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const at = tokenResponse?.access_token;
        if (!at) {
          toast.error('Không nhận được token từ Google. Thử lại.');
          return;
        }
        const res = await dispatch(googleLogin(at));

        if (!googleLogin.fulfilled.match(res)) {
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
    },
    onError: () => toast.error('Đăng nhập Google thất bại'),
  });

  return (
    <button
      type="button"
      className="auth-google-btn"
      onClick={() => handleGoogle({ prompt: 'select_account' })}
      disabled={disabled || loading}
    >
      {loading
        ? <span className="auth-spinner dark" />
        : <><FcGoogle size={20} /> Đăng nhập với Google</>}
    </button>
  );
};

export default GoogleLoginButton;
