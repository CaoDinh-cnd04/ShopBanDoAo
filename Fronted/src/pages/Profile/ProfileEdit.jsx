import { useState } from 'react';
import { Card, Form, Button, Row, Col, Image } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaCamera } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './ProfileEdit.css';

const ProfileEdit = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || user?.Avatar || '/default-avatar.png');
  const [avatarFile, setAvatarFile] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || user?.FirstName || '',
      lastName: user?.lastName || user?.LastName || '',
      email: user?.email || user?.Email || '',
      phone: user?.phone || user?.Phone || '',
    },
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    formData.append('phone', data.phone);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const result = await dispatch(updateProfile(formData));
    if (updateProfile.fulfilled.match(result)) {
      toast.success('Cập nhật hồ sơ thành công!');
    } else {
      toast.error('Không thể cập nhật hồ sơ');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="profile-edit-card shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              {/* Avatar Section */}
              <Col md={4} className="text-center mb-4 mb-md-0">
                <div className="avatar-upload-section">
                  <div className="avatar-wrapper">
                    <Image
                      src={avatarPreview}
                      roundedCircle
                      className="profile-avatar"
                      alt="Avatar"
                    />
                    <label htmlFor="avatar-input" className="avatar-upload-btn">
                      <FaCamera />
                      <input
                        id="avatar-input"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        hidden
                      />
                    </label>
                  </div>
                  <p className="text-muted mt-3 small">
                    Click vào icon camera để thay đổi ảnh đại diện
                  </p>
                </div>
              </Col>

              {/* Form Section */}
              <Col md={8}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="d-flex align-items-center gap-2">
                        <FaUser className="text-primary" />
                        Họ
                      </Form.Label>
                      <Form.Control
                        {...register('firstName', { required: 'Vui lòng nhập họ' })}
                        isInvalid={!!errors.firstName}
                        placeholder="Nhập họ của bạn"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.firstName?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="d-flex align-items-center gap-2">
                        <FaUser className="text-primary" />
                        Tên
                      </Form.Label>
                      <Form.Control
                        {...register('lastName', { required: 'Vui lòng nhập tên' })}
                        isInvalid={!!errors.lastName}
                        placeholder="Nhập tên của bạn"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.lastName?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center gap-2">
                    <FaEnvelope className="text-primary" />
                    Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    {...register('email')}
                    disabled
                    className="bg-light"
                  />
                  <Form.Text className="text-muted">
                    Email không thể thay đổi
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="d-flex align-items-center gap-2">
                    <FaPhone className="text-primary" />
                    Số điện thoại
                  </Form.Label>
                  <Form.Control
                    {...register('phone', {
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Số điện thoại không hợp lệ (10 chữ số)',
                      },
                    })}
                    isInvalid={!!errors.phone}
                    placeholder="Nhập số điện thoại"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className="px-4"
                  >
                    {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => window.location.reload()}
                  >
                    Hủy
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default ProfileEdit;
