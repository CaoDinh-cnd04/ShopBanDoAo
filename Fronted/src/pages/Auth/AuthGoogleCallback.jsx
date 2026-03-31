import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
  googleAuthCodeExchange,
  isAdminUser,
} from '../../store/slices/authSlice';
import { getGoogleRedirectUri, parseGoogleOAuthState } from '../../config/googleAuth';
import './Auth.css';

const safeReturn = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const d = decodeURIComponent(raw);
    return d.startsWith('/') && !d.startsWith('//') ? d : null;
  } catch {
    return null;
  }
};

/**
 * Google redirect về đây với ?code= hoặc ?error=
 */
const AuthGoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const err = searchParams.get('error');
      const errDesc = searchParams.get('error_description');
      if (err) {
        toast.error(errDesc || err || 'Đăng nhập Google bị hủy');
        navigate('/login', { replace: true });
        return;
      }

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      if (!code) {
        toast.error('Thiếu mã xác thực Google');
        navigate('/login', { replace: true });
        return;
      }

      const redirectUri = getGoogleRedirectUri();
      const parsed = parseGoogleOAuthState(state);
      const returnFromState = safeReturn(parsed.returnUrl);

      const res = await dispatch(
        googleAuthCodeExchange({ code, redirectUri }),
      );
      if (googleAuthCodeExchange.fulfilled.match(res)) {
        toast.success('Đăng nhập Google thành công! 🎉');
        const user = res.payload?.user;
        const target =
          returnFromState ||
          (user && isAdminUser(user) ? '/admin' : '/');
        navigate(target, { replace: true });
      } else {
        toast.error(res.payload || 'Đăng nhập Google thất bại');
        navigate('/login', { replace: true });
      }
    };
    void run();
  }, [dispatch, navigate, searchParams]);

  return (
    <div className="auth-page" style={{ justifyContent: 'center', minHeight: '60vh' }}>
      <p className="auth-form-subtitle" style={{ textAlign: 'center' }}>
        Đang xác thực với Google…
      </p>
      <span className="auth-spinner dark" style={{ margin: '1rem auto', display: 'block' }} />
    </div>
  );
};

export default AuthGoogleCallback;
