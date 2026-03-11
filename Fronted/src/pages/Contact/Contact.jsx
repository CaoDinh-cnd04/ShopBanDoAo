import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiMail, FiPhone, FiMapPin, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Contact.css';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const Contact = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // TODO: Integrate with backend API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(t('contact.success'));
      reset();
    } catch (error) {
      toast.error(t('contact.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: FiMail,
      title: t('contact.info.email.title'),
      content: 'support@sportsecommerce.com',
    },
    {
      icon: FiPhone,
      title: t('contact.info.phone.title'),
      content: '+84 123 456 789',
    },
    {
      icon: FiMapPin,
      title: t('contact.info.address.title'),
      content: t('contact.info.address.content'),
    },
  ];

  return (
    <div className="contact-page">
      <Container className="py-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-5"
        >
          <h1 className="display-4 fw-bold gradient-text mb-4">
            {t('contact.title')}
          </h1>
          <p className="lead text-muted">
            {t('contact.subtitle')}
          </p>
        </motion.div>

        <Row>
          {/* Contact Form */}
          <Col lg={8} className="mb-4">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-sm p-4">
                <h3 className="fw-bold mb-4">{t('contact.form.title')}</h3>
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label>{t('contact.form.name')}</Form.Label>
                      <Form.Control
                        type="text"
                        {...register('name')}
                        placeholder={t('contact.form.namePlaceholder')}
                      />
                      {errors.name && (
                        <Form.Text className="text-danger">{errors.name.message}</Form.Text>
                      )}
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>{t('contact.form.email')}</Form.Label>
                      <Form.Control
                        type="email"
                        {...register('email')}
                        placeholder={t('contact.form.emailPlaceholder')}
                      />
                      {errors.email && (
                        <Form.Text className="text-danger">{errors.email.message}</Form.Text>
                      )}
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label>{t('contact.form.phone')}</Form.Label>
                      <Form.Control
                        type="tel"
                        {...register('phone')}
                        placeholder={t('contact.form.phonePlaceholder')}
                      />
                      {errors.phone && (
                        <Form.Text className="text-danger">{errors.phone.message}</Form.Text>
                      )}
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>{t('contact.form.subject')}</Form.Label>
                      <Form.Control
                        type="text"
                        {...register('subject')}
                        placeholder={t('contact.form.subjectPlaceholder')}
                      />
                      {errors.subject && (
                        <Form.Text className="text-danger">{errors.subject.message}</Form.Text>
                      )}
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('contact.form.message')}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      {...register('message')}
                      placeholder={t('contact.form.messagePlaceholder')}
                    />
                    {errors.message && (
                      <Form.Text className="text-danger">{errors.message.message}</Form.Text>
                    )}
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-100"
                  >
                    {isSubmitting ? (
                      t('common.loading')
                    ) : (
                      <>
                        <FiSend className="me-2" />
                        {t('contact.form.submit')}
                      </>
                    )}
                  </Button>
                </Form>
              </Card>
            </motion.div>
          </Col>

          {/* Contact Info */}
          <Col lg={4}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-sm p-4 mb-4">
                <h3 className="fw-bold mb-4">{t('contact.info.title')}</h3>
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <motion.div
                      key={index}
                      className="d-flex align-items-start mb-4"
                      whileHover={{ x: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="contact-icon me-3">
                        <Icon size={24} className="text-primary" />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1">{info.title}</h6>
                        <p className="text-muted mb-0">{info.content}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </Card>

              <Card className="border-0 shadow-sm p-4">
                <h5 className="fw-bold mb-3">{t('contact.hours.title')}</h5>
                <p className="mb-2">
                  <strong>{t('contact.hours.weekdays')}</strong>
                  <br />
                  {t('contact.hours.weekdaysTime')}
                </p>
                <p className="mb-0">
                  <strong>{t('contact.hours.weekend')}</strong>
                  <br />
                  {t('contact.hours.weekendTime')}
                </p>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Contact;
