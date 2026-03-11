import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { FcGoogle } from 'react-icons/fc';
import { register, firebaseLogin } from '../../store/slices/authSlice';
import { signInWithGoogle } from '../../utils/googleAuth';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';
import './Auth.css';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    const { confirmPassword, ...userData } = data;
    const result = await dispatch(register(userData));
    if (register.fulfilled.match(result)) {
      toast.success('Registration successful!');
      navigate('/');
    } else {
      toast.error(result.payload || 'Registration failed');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const idToken = await signInWithGoogle();
      const result = await dispatch(firebaseLogin(idToken));
      if (firebaseLogin.fulfilled.match(result)) {
        toast.success('Login with Google successful!');
        navigate('/');
      } else {
        toast.error(result.payload || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info('Sign in cancelled');
      } else {
        toast.error(error.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card>
            <Card.Body className="p-5">
              <h2 className="text-center fw-bold mb-4">{t('auth.register')}</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('auth.firstName')}</Form.Label>
                      <Form.Control
                        type="text"
                        {...registerForm('firstName')}
                        placeholder="First name"
                      />
                      {errors.firstName && (
                        <Form.Text className="text-danger">{errors.firstName.message}</Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('auth.lastName')}</Form.Label>
                      <Form.Control
                        type="text"
                        {...registerForm('lastName')}
                        placeholder="Last name"
                      />
                      {errors.lastName && (
                        <Form.Text className="text-danger">{errors.lastName.message}</Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>{t('auth.email')}</Form.Label>
                  <Form.Control
                    type="email"
                    {...registerForm('email')}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <Form.Text className="text-danger">{errors.email.message}</Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('auth.phone')}</Form.Label>
                  <Form.Control
                    type="tel"
                    {...registerForm('phone')}
                    placeholder="Enter your phone"
                  />
                  {errors.phone && (
                    <Form.Text className="text-danger">{errors.phone.message}</Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('auth.password')}</Form.Label>
                  <Form.Control
                    type="password"
                    {...registerForm('password')}
                    placeholder="Enter your password"
                  />
                  {errors.password && (
                    <Form.Text className="text-danger">{errors.password.message}</Form.Text>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('auth.confirmPassword')}</Form.Label>
                  <Form.Control
                    type="password"
                    {...registerForm('confirmPassword')}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && (
                    <Form.Text className="text-danger">{errors.confirmPassword.message}</Form.Text>
                  )}
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 mb-3"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? <Loading /> : t('auth.register')}
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
                    {t('auth.hasAccount')}{' '}
                    <Link to="/login" className="text-decoration-none fw-bold">
                      {t('auth.login')}
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

export default Register;
