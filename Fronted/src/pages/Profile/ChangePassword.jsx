import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const ChangePassword = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data) => {
    const result = await dispatch(
      changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
    );

    if (changePassword.fulfilled.match(result)) {
      toast.success('Password changed successfully!');
      reset();
    } else {
      toast.error(result.payload || 'Failed to change password');
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Change Password</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3">
            <Form.Label>Current Password *</Form.Label>
            <Form.Control
              type="password"
              {...register('currentPassword')}
              placeholder="Enter current password"
            />
            {errors.currentPassword && (
              <Form.Text className="text-danger">
                {errors.currentPassword.message}
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New Password *</Form.Label>
            <Form.Control
              type="password"
              {...register('newPassword')}
              placeholder="Enter new password"
            />
            {errors.newPassword && (
              <Form.Text className="text-danger">
                {errors.newPassword.message}
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Confirm New Password *</Form.Label>
            <Form.Control
              type="password"
              {...register('confirmPassword')}
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <Form.Text className="text-danger">
                {errors.confirmPassword.message}
              </Form.Text>
            )}
          </Form.Group>

          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Changing...' : 'Change Password'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ChangePassword;
