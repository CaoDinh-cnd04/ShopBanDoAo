import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import {
  FiFacebook, FiInstagram, FiTwitter, FiYoutube,
  FiMail, FiPhone, FiMapPin, FiArrowRight
} from 'react-icons/fi';
import './Footer.css';

const SHOP_LINKS = [
  { to: '/products', label: 'Tất cả sản phẩm' },
  { to: '/products?category=ao', label: 'Áo thể thao' },
  { to: '/products?category=giay', label: 'Giày thể thao' },
  { to: '/products?isFeatured=1', label: 'Sản phẩm nổi bật' },
];
const COURT_LINKS = [
  { to: '/courts', label: 'Tất cả sân' },
  { to: '/courts?type=tennis', label: 'Sân Tennis' },
  { to: '/courts?type=badminton', label: 'Sân Cầu lông' },
  { to: '/courts?type=football', label: 'Sân Bóng đá' },
];
const SUPPORT_LINKS = [
  { to: '/faq', label: 'Câu hỏi thường gặp' },
  { to: '/contact', label: 'Liên hệ' },
  { to: '/shipping', label: 'Vận chuyển & Đổi trả' },
  { to: '/privacy', label: 'Chính sách bảo mật' },
  { to: '/terms', label: 'Điều khoản sử dụng' },
];

const SOCIALS = [
  { icon: FiFacebook, href: '#', label: 'Facebook' },
  { icon: FiInstagram, href: '#', label: 'Instagram' },
  { icon: FiTwitter, href: '#', label: 'Twitter' },
  { icon: FiYoutube, href: '#', label: 'YouTube' },
];

const Footer = () => {
  return (
    <footer className="footer-premium">
      {/* Wave divider */}
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
            {/* Brand column */}
            <Col lg={4} md={12}>
              <div className="footer-brand">
                <Link to="/" className="footer-logo">
                  ⚡ <span>SPORTS</span>
                </Link>
                <p className="footer-tagline">
                  Hệ thống mua sắm & đặt sân thể thao hàng đầu Việt Nam — chất lượng cao, dịch vụ tốt.
                </p>
                {/* Social */}
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

            {/* Links columns */}
            <Col lg={2} sm={6}>
              <FooterLinkGroup title="Mua sắm" links={SHOP_LINKS} />
            </Col>
            <Col lg={2} sm={6}>
              <FooterLinkGroup title="Đặt sân" links={COURT_LINKS} />
            </Col>
            <Col lg={2} sm={6}>
              <FooterLinkGroup title="Hỗ trợ" links={SUPPORT_LINKS} />
            </Col>

            {/* Contact column */}
            <Col lg={2} sm={6}>
              <h6 className="footer-heading">Liên hệ</h6>
              <ul className="footer-contact-list">
                <li>
                  <FiMapPin size={14} />
                  <span>123 Đường ABC, Q.1, TP.HCM</span>
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
            <p>© {new Date().getFullYear()} Sports E-Commerce. All rights reserved.</p>
            <div className="footer-bottom-links">
              <Link to="/privacy">Bảo mật</Link>
              <Link to="/terms">Điều khoản</Link>
              <Link to="/sitemap">Sitemap</Link>
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
