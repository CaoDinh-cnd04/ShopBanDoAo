import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { login, isAdminUser } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import { isGoogleAuthConfigured } from '../../config/googleAuth';
import GoogleLoginButton from '../../components/Auth/GoogleLoginButton';
import './Auth.css';

const schema = z.object({
  email:    z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

const safeReturn = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const d = decodeURIComponent(raw);
    return d.startsWith('/') && !d.startsWith('//') ? d : null;
  } catch { return null; }
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const redirectAfterLogin = (user) => {
    const back = safeReturn(searchParams.get('returnUrl'));
    navigate(back || (isAdminUser(user) ? '/admin' : '/'), { replace: true });
  };

  const onSubmit = async (data) => {
    const res = await dispatch(login(data));
    if (login.fulfilled.match(res)) {
      toast.success('Đăng nhập thành công! 🎉');
      redirectAfterLogin(res.payload?.user);
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
    <div className="auth-page">
      {/* Info panel */}
      <div className="auth-panel-left">
        <div className="auth-panel-content">
          <div className="auth-logo">⚡ SPORTS</div>
          <h2 className="auth-panel-title">Chào mừng trở lại!</h2>
          <p className="auth-panel-sub">
            Đăng nhập để tiếp tục mua sắm và đặt sân thể thao.
          </p>
          <div className="auth-panel-badges">
            {['Bảo mật', 'Nhanh chóng', 'Ưu đãi VIP'].map((b) => (
              <span key={b} className="auth-panel-badge">{b}</span>
            ))}
          </div>
        </div>
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
      </div>

      {/* Form panel */}
      <div className="auth-panel-right">
        <motion.div
          className="auth-form-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h1 className="auth-form-title">Đăng nhập</h1>
          <p className="auth-form-subtitle">
            Chưa có tài khoản? <Link to="/register" className="auth-link">Đăng ký →</Link>
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
                <button type="button" className="auth-eye-btn" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              }
            />

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? <span className="auth-spinner" /> : <><FiArrowRight size={16} /> Đăng nhập</>}
            </button>

            {isGoogleAuthConfigured && (
              <>
                <div className="auth-divider"><span>hoặc</span></div>
                <GoogleLoginButton
                  onSuccess={(res) => redirectAfterLogin(res.payload?.user)}
                  disabled={isLoading}
                />
              </>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
