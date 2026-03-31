import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { register as registerAction } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import { isGoogleAuthConfigured } from '../../config/googleAuth';
import GoogleLoginButton from '../../components/Auth/GoogleLoginButton';
import './Auth.css';

const buildSchema = (fromGoogle) =>
  z.object({
    fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
    password: fromGoogle
      ? z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').or(z.literal(''))
      : z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirmPassword: z.string(),
  }).refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);
  const [searchParams] = useSearchParams();

  const fromGoogle = searchParams.get('fromGoogle') === '1';
  const preEmail  = searchParams.get('email') || '';
  const preName   = searchParams.get('fullName') || '';

  const schema = buildSchema(fromGoogle);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '' } });

  useEffect(() => {
    if (fromGoogle) {
      if (preEmail) setValue('email', preEmail);
      if (preName)  setValue('fullName', preName);
    }
  }, [fromGoogle, preEmail, preName, setValue]);

  const onSubmit = async (data) => {
    const payload = { ...data };
    delete payload.confirmPassword;
    // Nếu đến từ Google và người dùng không điền mật khẩu → dùng placeholder
    if (fromGoogle && !payload.password) {
      payload.password = 'google_oauth_no_password_set_later';
    }
    const res = await dispatch(registerAction(payload));
    if (registerAction.fulfilled.match(res)) {
      toast.success('Đăng ký thành công! 🎉');
      navigate('/');
    } else {
      toast.error(res.payload || 'Đăng ký thất bại');
    }
  };

  const Field = ({ name, label, type = 'text', placeholder, icon: Icon, extra, readOnly }) => (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      <div className="auth-input-wrap">
        {Icon && <Icon className="auth-input-icon" size={16} />}
        <input
          type={type}
          className={`auth-input ${errors[name] ? 'error' : ''} ${readOnly ? 'auth-input-readonly' : ''}`}
          placeholder={placeholder}
          readOnly={readOnly}
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
          <h2 className="auth-panel-title">
            {fromGoogle ? 'Hoàn tất đăng ký' : 'Tham gia cùng chúng tôi!'}
          </h2>
          <p className="auth-panel-sub">
            {fromGoogle
              ? 'Tài khoản Google của bạn đã được xác thực. Vui lòng điền thêm thông tin để hoàn tất.'
              : 'Tạo tài khoản để mua sắm thể thao và đặt sân với hàng ngàn khách hàng tin dùng.'}
          </p>
          <div className="auth-panel-badges">
            {(fromGoogle
              ? ['Google đã xác thực', 'An toàn', 'Nhanh chóng']
              : ['Miễn phí đăng ký', 'Ưu đãi thành viên', 'Hỗ trợ 24/7']
            ).map((b) => (
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
          <h1 className="auth-form-title">
            {fromGoogle ? 'Hoàn tất đăng ký' : 'Đăng ký'}
          </h1>
          <p className="auth-form-subtitle">
            {fromGoogle ? (
              <>Xác thực qua Google thành công — điền thêm thông tin bên dưới.</>
            ) : (
              <>Đã có tài khoản? <Link to="/login" className="auth-link">Đăng nhập →</Link></>
            )}
          </p>

          {fromGoogle && (
            <div className="auth-google-notice">
              <span>✓ Xác thực Google thành công</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
            <Field
              name="fullName"
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              icon={FiUser}
              readOnly={fromGoogle && !!preName}
            />
            <Field
              name="email"
              label="Email"
              type="email"
              placeholder="your@email.com"
              icon={FiMail}
              readOnly={fromGoogle && !!preEmail}
            />
            <Field
              name="phone"
              label="Số điện thoại"
              type="tel"
              placeholder="0901234567"
              icon={FiPhone}
            />

            <Field
              name="password"
              label={fromGoogle ? 'Mật khẩu (tùy chọn)' : 'Mật khẩu'}
              type={showPwd ? 'text' : 'password'}
              placeholder={fromGoogle ? '(để trống nếu chỉ dùng Google)' : '••••••••'}
              icon={FiLock}
              extra={
                <button type="button" className="auth-eye-btn" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}>
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              }
            />
            {!fromGoogle && (
              <Field
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                type="password"
                placeholder="••••••••"
                icon={FiLock}
              />
            )}

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading
                ? <span className="auth-spinner" />
                : <><FiArrowRight size={16} /> {fromGoogle ? 'Hoàn tất đăng ký' : 'Tạo tài khoản'}</>}
            </button>

            {!fromGoogle && isGoogleAuthConfigured && (
              <>
                <div className="auth-divider"><span>hoặc</span></div>
                <GoogleLoginButton disabled={isLoading} />
              </>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
