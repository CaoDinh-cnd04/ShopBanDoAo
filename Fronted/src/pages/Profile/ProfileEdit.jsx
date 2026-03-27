import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiCamera, FiSave, FiX } from 'react-icons/fi';
import { updateProfile } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';

const schema = z.object({
  fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  phone: z
    .string()
    .regex(/^(0|\+84)[3-9]\d{8}$/, 'Số điện thoại không hợp lệ')
    .or(z.literal('')),
});

const ProfileEdit = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((s) => s.auth);
  const [avatarPreview] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (data) => {
    const result = await dispatch(updateProfile(data));
    if (updateProfile.fulfilled.match(result)) {
      toast.success('Cập nhật hồ sơ thành công!');
      reset(data);
    } else {
      toast.error(result.payload || 'Không thể cập nhật hồ sơ');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="profile-section-card">
        <div className="profile-section-header">
          <h2 className="profile-section-title">Thông tin cá nhân</h2>
          <p className="profile-section-sub">Cập nhật thông tin hồ sơ của bạn</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="profile-avatar-row">
            <div className="profile-avatar-upload">
              <div className="profile-avatar-circle">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" />
                  : <span>{user?.fullName?.[0]?.toUpperCase() || <FiUser />}</span>}
                <label className="profile-avatar-overlay" htmlFor="avatar-file">
                  <FiCamera size={18} />
                </label>
                <input id="avatar-file" type="file" accept="image/*" hidden />
              </div>
              <p className="profile-avatar-hint">Click vào icon camera để thay đổi ảnh đại diện</p>
            </div>

            <div className="profile-form-fields">
              {/* Họ và tên */}
              <div className="profile-field">
                <label className="profile-field-label">
                  <FiUser size={14} /> Họ và tên
                </label>
                <input
                  type="text"
                  className={`profile-field-input ${errors.fullName ? 'error' : ''}`}
                  placeholder="Nguyễn Văn A"
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <span className="profile-field-error">{errors.fullName.message}</span>
                )}
              </div>

              {/* Email (readonly) */}
              <div className="profile-field">
                <label className="profile-field-label">
                  <FiMail size={14} /> Email
                </label>
                <input
                  type="email"
                  className="profile-field-input readonly"
                  value={user?.email || ''}
                  readOnly
                />
                <span className="profile-field-hint">Email không thể thay đổi</span>
              </div>

              {/* Số điện thoại */}
              <div className="profile-field">
                <label className="profile-field-label">
                  <FiPhone size={14} /> Số điện thoại
                </label>
                <input
                  type="tel"
                  className={`profile-field-input ${errors.phone ? 'error' : ''}`}
                  placeholder="0901234567"
                  {...register('phone')}
                />
                {errors.phone && (
                  <span className="profile-field-error">{errors.phone.message}</span>
                )}
              </div>

              <div className="profile-form-actions">
                <button
                  type="submit"
                  className="profile-btn-primary"
                  disabled={isLoading || !isDirty}
                >
                  {isLoading ? (
                    <span className="profile-spinner" />
                  ) : (
                    <><FiSave size={15} /> Lưu thay đổi</>
                  )}
                </button>
                <button
                  type="button"
                  className="profile-btn-secondary"
                  onClick={() => reset()}
                  disabled={!isDirty}
                >
                  <FiX size={15} /> Hủy
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ProfileEdit;
