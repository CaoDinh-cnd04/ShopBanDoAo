import { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiMail, FiPhone, FiMapPin, FiSend, FiClock, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Contact.css';

const schema = z.object({
  name:    z.string().min(1, 'Bắt buộc'),
  email:   z.string().email('Email không hợp lệ'),
  phone:   z.string().min(10, 'Số điện thoại không hợp lệ'),
  subject: z.string().min(1, 'Bắt buộc'),
  message: z.string().min(10, 'Tối thiểu 10 ký tự'),
});

const INFO_ITEMS = [
  { icon: FiMail,    label: 'Email',          value: 'support@sports.vn' },
  { icon: FiPhone,   label: 'Điện thoại',     value: '1800 9999 (miễn phí)' },
  { icon: FiMapPin,  label: 'Địa chỉ',        value: '123 Nguyễn Văn Linh, Q.7, TP.HCM' },
  { icon: FiClock,   label: 'Giờ làm việc',   value: 'T2–T6: 8:00 – 18:00\nT7: 8:00 – 12:00' },
];

const Contact = () => {
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Gửi thành công! Chúng tôi sẽ liên hệ lại sớm 📨');
    reset();
    setSending(false);
  };

  return (
    <div className="contact-page">
      {/* Hero */}
      <section className="contact-hero">
        <Container>
          <motion.div
            className="contact-hero-content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="section-eyebrow">💬 Liên hệ với chúng tôi</span>
            <h1 className="contact-hero-title">Chúng tôi luôn<br /><span className="gradient-text">sẵn sàng hỗ trợ</span></h1>
            <p className="contact-hero-sub">Có câu hỏi về sản phẩm hay dịch vụ? Đội ngũ chúng tôi sẵn sàng giải đáp trong vòng 24 giờ.</p>
          </motion.div>
        </Container>
        <div className="contact-hero-blob" />
      </section>

      <Container className="contact-main">
        <Row className="g-4">
          {/* Form */}
          <Col lg={8}>
            <motion.div
              className="contact-form-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="contact-form-title"><FiMessageSquare size={20} /> Gửi tin nhắn cho chúng tôi</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="contact-form" noValidate>
                <div className="contact-grid">
                  {/* Name */}
                  <div className="cf-field">
                    <label className="cf-label">Họ tên *</label>
                    <input className={`cf-input ${errors.name ? 'error' : ''}`} placeholder="Nguyễn Văn A" {...register('name')} />
                    {errors.name && <span className="cf-error">{errors.name.message}</span>}
                  </div>
                  {/* Email */}
                  <div className="cf-field">
                    <label className="cf-label">Email *</label>
                    <input type="email" className={`cf-input ${errors.email ? 'error' : ''}`} placeholder="your@email.com" {...register('email')} />
                    {errors.email && <span className="cf-error">{errors.email.message}</span>}
                  </div>
                  {/* Phone */}
                  <div className="cf-field">
                    <label className="cf-label">Số điện thoại *</label>
                    <input type="tel" className={`cf-input ${errors.phone ? 'error' : ''}`} placeholder="0912 345 678" {...register('phone')} />
                    {errors.phone && <span className="cf-error">{errors.phone.message}</span>}
                  </div>
                  {/* Subject */}
                  <div className="cf-field">
                    <label className="cf-label">Chủ đề *</label>
                    <input className={`cf-input ${errors.subject ? 'error' : ''}`} placeholder="Hỏi về sản phẩm..." {...register('subject')} />
                    {errors.subject && <span className="cf-error">{errors.subject.message}</span>}
                  </div>
                  {/* Message */}
                  <div className="cf-field cf-full">
                    <label className="cf-label">Nội dung *</label>
                    <textarea rows={5} className={`cf-input ${errors.message ? 'error' : ''}`} placeholder="Nhập nội dung liên hệ..." {...register('message')} />
                    {errors.message && <span className="cf-error">{errors.message.message}</span>}
                  </div>
                </div>
                <motion.button
                  type="submit"
                  className="cf-submit-btn"
                  disabled={sending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {sending ? <span className="auth-spinner" /> : <><FiSend size={16} /> Gửi tin nhắn</>}
                </motion.button>
              </form>
            </motion.div>
          </Col>

          {/* Info */}
          <Col lg={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="contact-info-card">
                <h3 className="ci-title">Thông tin liên hệ</h3>
                <div className="ci-items">
                  {INFO_ITEMS.map(({ icon: Icon, label, value }) => (
                    <div className="ci-item" key={label}>
                      <div className="ci-icon"><Icon size={18} /></div>
                      <div>
                        <p className="ci-label">{label}</p>
                        <p className="ci-value">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map placeholder */}
              <div className="contact-map-placeholder">
                <FiMapPin size={28} />
                <p>Bản đồ Google Maps</p>
                <span>123 Nguyễn Văn Linh, Quận 7, TP.HCM</span>
              </div>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Contact;
