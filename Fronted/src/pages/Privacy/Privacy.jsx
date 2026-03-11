import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import './Privacy.css';

const Privacy = () => {
  const { t } = useTranslation();

  return (
    <div className="privacy-page">
      <Container className="py-5" style={{ maxWidth: '900px' }}>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5"
        >
          <h1 className="display-4 fw-bold gradient-text mb-4">
            {t('privacy.title')}
          </h1>
          <p className="text-muted">
            {t('privacy.lastUpdated')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="privacy-content"
        >
          <section className="mb-5">
            <h3 className="fw-bold mb-3">{t('privacy.sections.1.title')}</h3>
            <p className="text-muted">{t('privacy.sections.1.content')}</p>
          </section>

          <section className="mb-5">
            <h3 className="fw-bold mb-3">{t('privacy.sections.2.title')}</h3>
            <p className="text-muted">{t('privacy.sections.2.content')}</p>
          </section>

          <section className="mb-5">
            <h3 className="fw-bold mb-3">{t('privacy.sections.3.title')}</h3>
            <p className="text-muted">{t('privacy.sections.3.content')}</p>
          </section>

          <section className="mb-5">
            <h3 className="fw-bold mb-3">{t('privacy.sections.4.title')}</h3>
            <p className="text-muted">{t('privacy.sections.4.content')}</p>
          </section>

          <section className="mb-5">
            <h3 className="fw-bold mb-3">{t('privacy.sections.5.title')}</h3>
            <p className="text-muted">{t('privacy.sections.5.content')}</p>
          </section>

          <section className="mb-5">
            <h3 className="fw-bold mb-3">{t('privacy.sections.6.title')}</h3>
            <p className="text-muted">{t('privacy.sections.6.content')}</p>
          </section>
        </motion.div>
      </Container>
    </div>
  );
};

export default Privacy;
