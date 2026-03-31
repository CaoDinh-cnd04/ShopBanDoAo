import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { login, isAdminUser } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import { isGoogleAuthConfigured } from '../../config/googleAuth';
import GoogleLoginButton from '../../components/Auth/GoogleLoginButton';
import { safeReturnUrl } from '../../auth/returnUrl';
import AuthShell from './AuthShell';
import './Auth.css';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const afterLogin = (user) => {
    const back = safeReturnUrl(searchParams.get('returnUrl'));
    navigate(back || (isAdminUser(user) ? '/admin' : '/'), { replace: true });
  };

  const onSubmit = async (data) => {
    const res = await dispatch(login(data));
    if (login.fulfilled.match(res)) {
      toast.success('Đăng nhập thành công');
      afterLogin(res.payload?.user);
    } else {
      toast.error(res.payload || 'Đăng nhập thất bại');
    }
  };

  const Field = ({ name, label, type = 'text', placeholder, icon: Icon, extra }) => (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      <div className="auth-input-wrap">
        {Icon && <Icon className="auth-input-icon" size={16} />}
        <input
          type={type}
          className={`auth-input ${errors[name] ? 'error' : ''}`}
          placeholder={placeholder}
          {...register(name)}
        />
        {extra}
      </div>
      {errors[name] && <span className="auth-error">{errors[name].message}</span>}
    </div>
  );

  return (
    <AuthShell
      leftTitle="Chào mừng trở lại!"
      leftSubtitle="Đăng nhập để tiếp tục mua sắm và đặt sân thể thao."
      badges={['Bảo mật', 'Nhanh chóng', 'Ưu đãi VIP']}
    >
      <h1 className="auth-form-title">Đăng nhập</h1>
      <p className="auth-form-subtitle">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="auth-link">
          Đăng ký →
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        <Field name="email" label="Email" type="email" placeholder="your@email.com" icon={FiMail} />
        <Field
          name="password"
          label="Mật khẩu"
          type={showPwd ? 'text' : 'password'}
          placeholder="••••••••"
          icon={FiLock}
          extra={
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPwd((v) => !v)}
              tabIndex={-1}
            >
              {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          }
        />

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? (
            <span className="auth-spinner" />
          ) : (
            <>
              <FiArrowRight size={16} /> Đăng nhập
            </>
          )}
        </button>

        {isGoogleAuthConfigured && (
          <>
            <div className="auth-divider">
              <span>hoặc</span>
            </div>
            <GoogleLoginButton returnUrl={searchParams.get('returnUrl')} disabled={isLoading} />
          </>
        )}
      </form>
    </AuthShell>
  );
}
