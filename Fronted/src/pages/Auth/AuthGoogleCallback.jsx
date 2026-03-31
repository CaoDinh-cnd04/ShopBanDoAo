import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { googleAuthCodeExchange, isAdminUser } from '../../store/slices/authSlice';
import { getGoogleRedirectUri, parseGoogleOAuthState } from '../../config/googleAuth';
import { safeReturnUrl } from '../../auth/returnUrl';
import './Auth.css';

/** Tránh gửi cùng một code 2 lần (React Strict Mode dev / F5 / nhiều tab) */
function oauthDedupeKey(code) {
  return `google_oauth_code_${code}`;
}

export default function AuthGoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
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

      const key = oauthDedupeKey(code);
      const prev = sessionStorage.getItem(key);
      if (prev === 'done') {
        navigate('/', { replace: true });
        return;
      }
      if (prev === 'pending') {
        return;
      }
      sessionStorage.setItem(key, 'pending');

      const redirectUri = getGoogleRedirectUri();
      const parsed = parseGoogleOAuthState(state);
      const returnFromState = safeReturnUrl(parsed.returnUrl);

      const res = await dispatch(googleAuthCodeExchange({ code, redirectUri }));
      if (googleAuthCodeExchange.fulfilled.match(res)) {
        sessionStorage.setItem(key, 'done');
        toast.success('Đăng nhập Google thành công');
        const user = res.payload?.user;
        const target = returnFromState || (user && isAdminUser(user) ? '/admin' : '/');
        navigate(target, { replace: true });
      } else {
        sessionStorage.removeItem(key);
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
}
