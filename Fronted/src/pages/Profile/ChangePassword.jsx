import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiSave } from 'react-icons/fi';
import { changePassword } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import { useState } from 'react';

const schema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

const ChangePassword = () => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.auth);
  const [show, setShow] = useState({ old: false, new: false, confirm: false });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const result = await dispatch(
      changePassword({ oldPassword: data.oldPassword, newPassword: data.newPassword })
    );
    if (changePassword.fulfilled.match(result)) {
      toast.success('Đổi mật khẩu thành công!');
      reset();
    } else {
      toast.error(result.payload || 'Đổi mật khẩu thất bại');
    }
  };

  const Field = ({ label, name, showKey }) => (
    <div className="profile-field">
      <label className="profile-field-label"><FiLock size={14} /> {label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show[showKey] ? 'text' : 'password'}
          className={`profile-field-input ${errors[name] ? 'error' : ''}`}
          placeholder="••••••••"
          style={{ paddingRight: '40px', width: '100%' }}
          {...register(name)}
        />
        <button
          type="button"
          onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
          style={{
            position: 'absolute', right: '10px', top: '50%',
            transform: 'translateY(-50%)', background: 'none',
            border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
            padding: '2px',
          }}
        >
          {show[showKey] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </div>
      {errors[name] && <span className="profile-field-error">{errors[name].message}</span>}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="profile-section-card">
        <div className="profile-section-header">
          <h2 className="profile-section-title">Đổi mật khẩu</h2>
          <p className="profile-section-sub">
            Mật khẩu tối thiểu 6 ký tự. Nếu đăng nhập bằng Google, bạn có thể đặt mật khẩu mới mà không cần nhập mật khẩu cũ.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: '440px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Mật khẩu hiện tại" name="oldPassword" showKey="old" />
            <Field label="Mật khẩu mới" name="newPassword" showKey="new" />
            <Field label="Xác nhận mật khẩu mới" name="confirmPassword" showKey="confirm" />
          </div>

          <div className="profile-form-actions" style={{ marginTop: '1.25rem' }}>
            <button type="submit" className="profile-btn-primary" disabled={isLoading}>
              {isLoading ? <span className="profile-spinner" /> : <><FiSave size={15} /> Đổi mật khẩu</>}
            </button>
            <button type="button" className="profile-btn-secondary" onClick={() => reset()}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ChangePassword;
