import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { register as registerUser } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import { isGoogleAuthConfigured } from '../../config/googleAuth';
import GoogleLoginButton from '../../components/Auth/GoogleLoginButton';
import InAppBrowserNotice from '../../components/Auth/InAppBrowserNotice';
import AuthShell from './AuthShell';
import './Auth.css';

const schema = z
  .object({
    fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    const res = await dispatch(
      registerUser({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      }),
    );
    if (registerUser.fulfilled.match(res)) {
      toast.success('Đăng ký thành công');
      navigate('/', { replace: true });
    } else {
      toast.error(res.payload || 'Đăng ký thất bại');
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
      leftTitle="Tham gia cùng chúng tôi!"
      leftSubtitle="Tạo tài khoản để mua sắm thể thao và đặt sân với hàng ngàn khách hàng tin dùng."
      badges={['Miễn phí đăng ký', 'Ưu đãi thành viên', 'Hỗ trợ 24/7']}
    >
      <h1 className="auth-form-title">Đăng ký</h1>
      <p className="auth-form-subtitle">
        Đã có tài khoản?{' '}
        <Link to="/login" className="auth-link">
          Đăng nhập →
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        <Field name="fullName" label="Họ và tên" placeholder="Nguyễn Văn A" icon={FiUser} />
        <Field name="email" label="Email" type="email" placeholder="your@email.com" icon={FiMail} />
        <Field name="phone" label="Số điện thoại" type="tel" placeholder="0901234567" icon={FiPhone} />
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
        <Field
          name="confirmPassword"
          label="Xác nhận mật khẩu"
          type="password"
          placeholder="••••••••"
          icon={FiLock}
        />

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? (
            <span className="auth-spinner" />
          ) : (
            <>
              <FiArrowRight size={16} /> Tạo tài khoản
            </>
          )}
        </button>

        {isGoogleAuthConfigured && (
          <>
            <div className="auth-divider">
              <span>hoặc</span>
            </div>
            <InAppBrowserNotice />
            <GoogleLoginButton disabled={isLoading} />
          </>
        )}
      </form>
    </AuthShell>
  );
}
