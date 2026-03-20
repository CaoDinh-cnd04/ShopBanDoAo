import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { FiLogIn } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { login, firebaseLogin } from '../../store/slices/authSlice';
import { signInWithGoogle } from '../../utils/googleAuth';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';
import './Auth.css';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const safeReturnPath = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
    return decoded;
  } catch {
    return null;
  }
};

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const onSubmit = async (data) => {
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      toast.success('Login successful!');
      const role = result.payload?.user?.role;
      const back = safeReturnPath(searchParams.get('returnUrl'));
      if (back) {
        navigate(back);
      } else {
        navigate(role === 'Admin' ? '/admin' : '/');
      }
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      // Sign in with Google using Firebase
      const idToken = await signInWithGoogle();
      
      // Send ID token to backend
      const result = await dispatch(firebaseLogin(idToken));
      
      if (firebaseLogin.fulfilled.match(result)) {
        toast.success('Login with Google successful!');
        const role = result.payload?.user?.role;
        const back = safeReturnPath(searchParams.get('returnUrl'));
        if (back) {
          navigate(back);
        } else {
          navigate(role === 'Admin' ? '/admin' : '/');
        }
      } else {
        toast.error(result.payload || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info('Sign in cancelled');
      } else {
        toast.error('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="auth-card">
            <Card.Body className="p-5">
              <h2 className="text-center fw-bold mb-4 gradient-text" style={{ fontSize: '2rem' }}>
                {t('auth.login')}
              </h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('auth.email')}</Form.Label>
                  <Form.Control
                    type="email"
                    data-testid="login-email"
                    {...register('email')}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <Form.Text className="text-danger">{errors.email.message}</Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('auth.password')}</Form.Label>
                  <Form.Control
                    type="password"
                    data-testid="login-password"
                    {...register('password')}
                    placeholder="Enter your password"
                  />
                  {errors.password && (
                    <Form.Text className="text-danger">{errors.password.message}</Form.Text>
                  )}
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Remember me"
                  />
                  <Link to="/forgot-password" className="text-decoration-none">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  data-testid="login-submit"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? <Loading /> : (
                    <>
                      <FiLogIn className="me-2" />
                      {t('auth.login')}
                    </>
                  )}
                </Button>

                {import.meta.env.VITE_FIREBASE_API_KEY && (
                  <>
                    <div className="divider mb-3">
                      <span className="divider-text">OR</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline-danger"
                      size="lg"
                      className="w-100 mb-3 google-btn"
                      onClick={handleGoogleLogin}
                      disabled={isLoading || isGoogleLoading}
                    >
                      {isGoogleLoading ? (
                        <Loading />
                      ) : (
                        <>
                          <FcGoogle size={20} className="me-2" />
                          {t('auth.loginWithGoogle')}
                        </>
                      )}
                    </Button>
                  </>
                )}

                <div className="text-center">
                  <p className="mb-0">
                    {t('auth.noAccount')}{' '}
                    <Link to="/register" className="text-decoration-none fw-bold">
                      {t('auth.register')}
                    </Link>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
