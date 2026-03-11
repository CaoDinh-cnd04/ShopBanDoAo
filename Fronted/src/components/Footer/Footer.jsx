import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer-custom mt-5">
      <Container>
        <Row className="py-5">
          <Col md={3} className="mb-4">
            <motion.h5
              className="fw-bold mb-3 gradient-text"
              whileHover={{ scale: 1.05 }}
            >
              SPORTS
            </motion.h5>
            <p className="text-muted">
              Your ultimate destination for sports gear and court bookings.
            </p>
            <div className="d-flex gap-3">
              {[
                { icon: FiFacebook, color: '#1877f2' },
                { icon: FiInstagram, color: '#e4405f' },
                { icon: FiTwitter, color: '#1da1f2' },
                { icon: FiYoutube, color: '#ff0000' },
              ].map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={index}
                    href="#"
                    className="text-dark"
                    whileHover={{ scale: 1.3, rotate: 360, color: social.color }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon size={20} />
                  </motion.a>
                );
              })}
            </div>
          </Col>
          <Col md={3} className="mb-4">
            <h6 className="fw-bold mb-3">{t('footer.shop.title')}</h6>
            <ul className="list-unstyled">
              <li><Link to="/products" className="text-muted text-decoration-none">{t('footer.shop.allProducts')}</Link></li>
              <li><Link to="/products?category=shoes" className="text-muted text-decoration-none">{t('footer.shop.shoes')}</Link></li>
              <li><Link to="/products?category=apparel" className="text-muted text-decoration-none">{t('footer.shop.apparel')}</Link></li>
              <li><Link to="/products?category=equipment" className="text-muted text-decoration-none">{t('footer.shop.equipment')}</Link></li>
            </ul>
          </Col>
          <Col md={3} className="mb-4">
            <h6 className="fw-bold mb-3">{t('footer.support.title')}</h6>
            <ul className="list-unstyled">
              <li><Link to="/about" className="text-muted text-decoration-none">{t('footer.support.about')}</Link></li>
              <li><Link to="/contact" className="text-muted text-decoration-none">{t('footer.support.contact')}</Link></li>
              <li><Link to="/faq" className="text-muted text-decoration-none">{t('footer.support.faq')}</Link></li>
              <li><Link to="/shipping" className="text-muted text-decoration-none">{t('footer.support.shipping')}</Link></li>
            </ul>
          </Col>
          <Col md={3} className="mb-4">
            <h6 className="fw-bold mb-3">{t('footer.bookings.title')}</h6>
            <ul className="list-unstyled">
              <li><Link to="/courts" className="text-muted text-decoration-none">{t('footer.bookings.findCourts')}</Link></li>
              <li><Link to="/courts?type=football" className="text-muted text-decoration-none">{t('footer.bookings.football')}</Link></li>
              <li><Link to="/courts?type=basketball" className="text-muted text-decoration-none">{t('footer.bookings.basketball')}</Link></li>
              <li><Link to="/courts?type=tennis" className="text-muted text-decoration-none">{t('footer.bookings.tennis')}</Link></li>
            </ul>
          </Col>
        </Row>
        <Row className="py-3 border-top">
          <Col md={6}>
            <p className="text-muted mb-0">
              &copy; {new Date().getFullYear()} {t('footer.copyright')}
            </p>
          </Col>
          <Col md={6} className="text-end">
            <Link to="/privacy" className="text-muted text-decoration-none me-3">{t('footer.privacy')}</Link>
            <Link to="/terms" className="text-muted text-decoration-none">{t('footer.terms')}</Link>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
