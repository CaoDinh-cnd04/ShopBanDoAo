import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { login, isAdminUser } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import { isGoogleAuthConfigured } from '../../config/googleAuth';
import GoogleLoginButton from '../../components/Auth/GoogleLoginButton';
import InAppBrowserNotice from '../../components/Auth/InAppBrowserNotice';
import { safeReturnUrl } from '../../auth/returnUrl';
import AuthShell from './AuthShell';
import './Auth.css';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('auth.validation.invalidEmail')),
        password: z.string().min(6, t('auth.validation.passwordMin')),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const badges = useMemo(
    () => [t('auth.badgeSecure'), t('auth.badgeFast'), t('auth.badgeVip')],
    [t],
  );

  const afterLogin = useCallback(
    (user) => {
      const back = safeReturnUrl(searchParams.get('returnUrl'));
      navigate(back || (isAdminUser(user) ? '/admin' : '/'), { replace: true });
    },
    [navigate, searchParams],
  );

  const onSubmit = async (data) => {
    const res = await dispatch(login(data));
    if (login.fulfilled.match(res)) {
      toast.success(t('auth.loginSuccess'));
      afterLogin(res.payload?.user);
    } else {
      toast.error(res.payload || t('auth.loginFail'));
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
      leftTitle={t('auth.welcomeBack')}
      leftSubtitle={t('auth.loginSubtitle')}
      badges={badges}
    >
      <h1 className="auth-form-title">{t('auth.login')}</h1>
      <p className="auth-form-subtitle">
        {t('auth.registerPrompt')}{' '}
        <Link to="/register" className="auth-link">
          {t('auth.registerLink')}
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        <Field name="email" label={t('auth.email')} type="email" placeholder="your@email.com" icon={FiMail} />
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

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? (
            <span className="auth-spinner" />
          ) : (
            <>
              <FiArrowRight size={16} /> {t('auth.login')}
            </>
          )}
        </button>

        {isGoogleAuthConfigured && (
          <>
            <div className="auth-divider">
              <span>{t('auth.or')}</span>
            </div>
            <InAppBrowserNotice />
            <GoogleLoginButton returnUrl={searchParams.get('returnUrl')} disabled={isLoading} />
          </>
        )}
      </form>
    </AuthShell>
  );
}
