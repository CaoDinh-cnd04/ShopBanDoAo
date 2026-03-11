import { Container, Row, Col, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiTarget, FiUsers, FiAward, FiHeart } from 'react-icons/fi';
import './About.css';

const About = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: FiTarget,
      title: t('about.mission.title'),
      description: t('about.mission.description'),
    },
    {
      icon: FiUsers,
      title: t('about.vision.title'),
      description: t('about.vision.description'),
    },
    {
      icon: FiAward,
      title: t('about.values.title'),
      description: t('about.values.description'),
    },
    {
      icon: FiHeart,
      title: t('about.commitment.title'),
      description: t('about.commitment.description'),
    },
  ];

  return (
    <div className="about-page">
      <Container className="py-5">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-5"
        >
          <h1 className="display-4 fw-bold gradient-text mb-4">
            {t('about.title')}
          </h1>
          <p className="lead text-muted" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {t('about.subtitle')}
          </p>
        </motion.div>

        {/* Story Section */}
        <Row className="mb-5">
          <Col md={12}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-sm p-4">
                <h2 className="fw-bold mb-3">{t('about.story.title')}</h2>
                <p className="text-muted">{t('about.story.content')}</p>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Features Grid */}
        <Row className="mb-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Col md={6} lg={3} key={index} className="mb-4">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <Card className="h-100 border-0 shadow-sm text-center p-4">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon size={48} className="text-primary mb-3" />
                    </motion.div>
                    <h5 className="fw-bold mb-3">{feature.title}</h5>
                    <p className="text-muted">{feature.description}</p>
                  </Card>
                </motion.div>
              </Col>
            );
          })}
        </Row>

        {/* Stats Section */}
        <Row className="mb-5">
          <Col md={12}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="stats-section p-5 rounded text-center"
            >
              <Row>
                <Col md={3} className="mb-3">
                  <h2 className="fw-bold gradient-text">10K+</h2>
                  <p className="text-muted mb-0">{t('about.stats.customers')}</p>
                </Col>
                <Col md={3} className="mb-3">
                  <h2 className="fw-bold gradient-text">500+</h2>
                  <p className="text-muted mb-0">{t('about.stats.products')}</p>
                </Col>
                <Col md={3} className="mb-3">
                  <h2 className="fw-bold gradient-text">50+</h2>
                  <p className="text-muted mb-0">{t('about.stats.courts')}</p>
                </Col>
                <Col md={3} className="mb-3">
                  <h2 className="fw-bold gradient-text">99%</h2>
                  <p className="text-muted mb-0">{t('about.stats.satisfaction')}</p>
                </Col>
              </Row>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default About;
