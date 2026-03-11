import { Container, Row, Col, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiTruck, FiClock, FiShield, FiPackage } from 'react-icons/fi';
import './Shipping.css';

const Shipping = () => {
  const { t } = useTranslation();

  const shippingMethods = [
    {
      icon: FiTruck,
      title: t('shipping.methods.standard.title'),
      description: t('shipping.methods.standard.description'),
      time: t('shipping.methods.standard.time'),
      price: t('shipping.methods.standard.price'),
    },
    {
      icon: FiClock,
      title: t('shipping.methods.express.title'),
      description: t('shipping.methods.express.description'),
      time: t('shipping.methods.express.time'),
      price: t('shipping.methods.express.price'),
    },
    {
      icon: FiShield,
      title: t('shipping.methods.premium.title'),
      description: t('shipping.methods.premium.description'),
      time: t('shipping.methods.premium.time'),
      price: t('shipping.methods.premium.price'),
    },
  ];

  const policies = [
    {
      icon: FiPackage,
      title: t('shipping.policies.returns.title'),
      description: t('shipping.policies.returns.description'),
    },
    {
      icon: FiShield,
      title: t('shipping.policies.insurance.title'),
      description: t('shipping.policies.insurance.description'),
    },
  ];

  return (
    <div className="shipping-page">
      <Container className="py-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-5"
        >
          <h1 className="display-4 fw-bold gradient-text mb-4">
            {t('shipping.title')}
          </h1>
          <p className="lead text-muted">
            {t('shipping.subtitle')}
          </p>
        </motion.div>

        {/* Shipping Methods */}
        <Row className="mb-5">
          {shippingMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <Col md={4} key={index} className="mb-4">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <Card className="h-100 border-0 shadow-sm p-4 text-center">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Icon size={48} className="text-primary mb-3" />
                    </motion.div>
                    <h5 className="fw-bold mb-3">{method.title}</h5>
                    <p className="text-muted mb-3">{method.description}</p>
                    <div className="mt-auto">
                      <p className="mb-1">
                        <strong>{t('shipping.time')}:</strong> {method.time}
                      </p>
                      <p className="mb-0">
                        <strong>{t('shipping.price')}:</strong> {method.price}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            );
          })}
        </Row>

        {/* Shipping Policies */}
        <Row className="mb-5">
          <Col md={12}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-sm p-4 mb-4">
                <h3 className="fw-bold mb-4">{t('shipping.policies.title')}</h3>
                <Row>
                  {policies.map((policy, index) => {
                    const Icon = policy.icon;
                    return (
                      <Col md={6} key={index} className="mb-3">
                        <div className="d-flex align-items-start">
                          <Icon size={24} className="text-primary me-3 mt-1" />
                          <div>
                            <h6 className="fw-bold mb-2">{policy.title}</h6>
                            <p className="text-muted mb-0">{policy.description}</p>
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Additional Info */}
        <Row>
          <Col md={12}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-sm p-4 bg-light">
                <h5 className="fw-bold mb-3">{t('shipping.info.title')}</h5>
                <p className="text-muted mb-0">{t('shipping.info.content')}</p>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Shipping;
