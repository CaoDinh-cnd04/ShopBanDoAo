import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import {
  FiFacebook, FiInstagram, FiTwitter, FiYoutube,
  FiMail, FiPhone, FiMapPin, FiArrowRight
} from 'react-icons/fi';
import './Footer.css';

const SOCIALS = [
  { icon: FiFacebook, href: '#', label: 'Facebook' },
  { icon: FiInstagram, href: '#', label: 'Instagram' },
  { icon: FiTwitter, href: '#', label: 'Twitter' },
  { icon: FiYoutube, href: '#', label: 'YouTube' },
];

const Footer = () => {
  const { t } = useTranslation();

  const shopLinks = useMemo(
    () => [
      { to: '/products', label: t('footer.shop.allProducts') },
      { to: '/products?category=ao', label: t('footer.linkShirts') },
      { to: '/products?category=giay', label: t('footer.linkShoes') },
      { to: '/products?isFeatured=1', label: t('footer.linkFeatured') },
    ],
    [t],
  );

  const courtLinks = useMemo(
    () => [
      { to: '/courts', label: t('footer.linkAllCourts') },
      { to: '/courts?type=tennis', label: t('footer.linkTennis') },
      { to: '/courts?type=badminton', label: t('footer.linkBadminton') },
      { to: '/courts?type=football', label: t('footer.linkFootball') },
    ],
    [t],
  );

  const supportLinks = useMemo(
    () => [
      { to: '/faq', label: t('footer.support.faq') },
      { to: '/contact', label: t('footer.support.contact') },
      { to: '/shipping', label: t('footer.linkShippingReturns') },
      { to: '/privacy', label: t('footer.privacy') },
      { to: '/terms', label: t('footer.linkTermsUse') },
    ],
    [t],
  );

  return (
    <footer className="footer-premium">
      <div className="footer-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path
            d="M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="footer-body">
        <Container>
          <Row className="gy-5">
            <Col lg={4} md={12}>
              <div className="footer-brand">
                <Link to="/" className="footer-logo">
                  ⚡ <span>SPORTS</span>
                </Link>
                <p className="footer-tagline">{t('footer.tagline')}</p>
                <div className="footer-socials">
                  {SOCIALS.map(({ icon: Icon, href, label }) => (
                    <motion.a
                      key={label}
                      href={href}
                      className="social-btn"
                      whileHover={{ scale: 1.15, y: -3 }}
                      whileTap={{ scale: 0.92 }}
                      aria-label={label}
                      rel="noopener noreferrer"
                    >
                      <Icon size={18} />
                    </motion.a>
                  ))}
                </div>
              </div>
            </Col>

            <Col lg={2} sm={6}>
              <FooterLinkGroup title={t('footer.shop.title')} links={shopLinks} />
            </Col>
            <Col lg={2} sm={6}>
              <FooterLinkGroup title={t('footer.bookings.title')} links={courtLinks} />
            </Col>
            <Col lg={2} sm={6}>
              <FooterLinkGroup title={t('footer.support.title')} links={supportLinks} />
            </Col>

            <Col lg={2} sm={6}>
              <h6 className="footer-heading">{t('footer.contactHeading')}</h6>
              <ul className="footer-contact-list">
                <li>
                  <FiMapPin size={14} />
                  <span>{t('contact.info.address.content')}</span>
                </li>
                <li>
                  <FiPhone size={14} />
                  <a href="tel:0123456789">0123 456 789</a>
                </li>
                <li>
                  <FiMail size={14} />
                  <a href="mailto:support@sports.vn">support@sports.vn</a>
                </li>
              </ul>
            </Col>
          </Row>

          <hr className="footer-divider" />

          <div className="footer-bottom">
            <p>{t('footer.copyrightLine', { year: new Date().getFullYear() })}</p>
            <div className="footer-bottom-links">
              <Link to="/privacy">{t('footer.bottomPrivacy')}</Link>
              <Link to="/terms">{t('footer.bottomTerms')}</Link>
              <Link to="/sitemap">{t('footer.bottomSitemap')}</Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};

const FooterLinkGroup = ({ title, links }) => (
  <div>
    <h6 className="footer-heading">{title}</h6>
    <ul className="footer-links">
      {links.map(({ to, label }) => (
        <li key={to}>
          <Link to={to} className="footer-link">
            <FiArrowRight size={12} />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default Footer;
