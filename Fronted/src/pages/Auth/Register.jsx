import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { register as registerUser } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import { isGoogleAuthConfigured } from '../../config/googleAuth';
import GoogleLoginButton from '../../components/Auth/GoogleLoginButton';
import InAppBrowserNotice from '../../components/Auth/InAppBrowserNotice';
import AuthShell from './AuthShell';
import './Auth.css';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);

  const schema = z
    .object({
      fullName: z.string().min(2, t('auth.validation.fullNameMin')),
      email: z.string().email(t('auth.validation.invalidEmail')),
      phone: z
        .string()
        .transform((s) => s.replace(/\s/g, ''))
        .refine((s) => /^(0|\+84)[3-9]\d{8}$/.test(s), t('auth.validation.phoneInvalid')),
      password: z.string().min(6, t('auth.validation.passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t('auth.validation.passwordMismatch'),
      path: ['confirmPassword'],
    });

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
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone,
        password: data.password,
      }),
    );
    if (registerUser.fulfilled.match(res)) {
      toast.success(t('auth.registerSuccess'));
      navigate('/', { replace: true });
    } else {
      toast.error(res.payload || t('auth.registerFail'));
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
      leftTitle={t('auth.joinTitle')}
      leftSubtitle={t('auth.joinSubtitle')}
      badges={[t('auth.badgeFree'), t('auth.badgeMember'), t('auth.badgeSupport')]}
    >
      <h1 className="auth-form-title">{t('auth.registerTitle')}</h1>
      <p className="auth-form-subtitle">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="auth-link">
          {t('auth.loginLink')}
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        <Field name="fullName" label={t('auth.fullName')} placeholder="Nguyễn Văn A" icon={FiUser} />
        <Field name="email" label={t('auth.email')} type="email" placeholder="your@email.com" icon={FiMail} />
        <Field name="phone" label={t('auth.phone')} type="tel" placeholder="0901234567" icon={FiPhone} />
        <Field
          name="password"
          label={t('auth.password')}
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
          label={t('auth.confirmPassword')}
          type="password"
          placeholder="••••••••"
          icon={FiLock}
        />

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? (
            <span className="auth-spinner" />
          ) : (
            <>
              <FiArrowRight size={16} /> {t('auth.createAccount')}
            </>
          )}
        </button>

        {isGoogleAuthConfigured && (
          <>
            <div className="auth-divider">
              <span>{t('auth.or')}</span>
            </div>
            <InAppBrowserNotice />
            <GoogleLoginButton disabled={isLoading} />
          </>
        )}
      </form>
    </AuthShell>
  );
}
