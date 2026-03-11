import { useState } from 'react';
import { Container, Accordion, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiChevronDown } from 'react-icons/fi';
import './FAQ.css';

const FAQ = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: t('faq.questions.1.question'),
      answer: t('faq.questions.1.answer'),
    },
    {
      question: t('faq.questions.2.question'),
      answer: t('faq.questions.2.answer'),
    },
    {
      question: t('faq.questions.3.question'),
      answer: t('faq.questions.3.answer'),
    },
    {
      question: t('faq.questions.4.question'),
      answer: t('faq.questions.4.answer'),
    },
    {
      question: t('faq.questions.5.question'),
      answer: t('faq.questions.5.answer'),
    },
    {
      question: t('faq.questions.6.question'),
      answer: t('faq.questions.6.answer'),
    },
    {
      question: t('faq.questions.7.question'),
      answer: t('faq.questions.7.answer'),
    },
    {
      question: t('faq.questions.8.question'),
      answer: t('faq.questions.8.answer'),
    },
  ];

  return (
    <div className="faq-page">
      <Container className="py-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-5"
        >
          <h1 className="display-4 fw-bold gradient-text mb-4">
            {t('faq.title')}
          </h1>
          <p className="lead text-muted">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: '900px', margin: '0 auto' }}
        >
          <Accordion defaultActiveKey="0" className="faq-accordion">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Accordion.Item eventKey={index.toString()} className="mb-3 border-0 shadow-sm">
                  <Accordion.Header
                    className="fw-bold"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  >
                    <div className="d-flex align-items-center w-100">
                      <span className="me-3">{faq.question}</span>
                      <motion.div
                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="ms-auto"
                      >
                        <FiChevronDown />
                      </motion.div>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="text-muted">
                    {faq.answer}
                  </Accordion.Body>
                </Accordion.Item>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-5"
        >
          <Card className="border-0 shadow-sm p-4 bg-light">
            <h5 className="fw-bold mb-3">{t('faq.cta.title')}</h5>
            <p className="text-muted mb-0">
              {t('faq.cta.description')}{' '}
              <a href="/contact" className="text-decoration-none fw-bold">
                {t('faq.cta.link')}
              </a>
            </p>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
};

export default FAQ;
