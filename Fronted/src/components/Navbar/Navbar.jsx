import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Form, Button, Badge, Dropdown } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiShoppingCart, FiUser, FiHeart, FiMoon, FiSun } from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { setFilters } from '../../store/slices/productSlice';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import './Navbar.css';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { totalItems } = useSelector((state) => state.cart);
  const { theme } = useSelector((state) => state.theme);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      dispatch(setFilters({ search: searchQuery }));
      navigate('/products');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <BootstrapNavbar expand="lg" className="navbar-custom" variant={theme === 'dark' ? 'dark' : 'light'}>
      <Container>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold fs-3">
            SPORTS
          </BootstrapNavbar.Brand>
        </motion.div>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">{t('nav.home')}</Nav.Link>
            <Nav.Link as={Link} to="/products">{t('nav.products')}</Nav.Link>
            <Nav.Link as={Link} to="/courts">{t('nav.courts')}</Nav.Link>
          </Nav>
          <Form className="d-flex me-3" onSubmit={handleSearch}>
            <Form.Control
              type="search"
              placeholder={t('nav.search')}
              className="me-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline-dark" type="submit">
              <FiSearch />
            </Button>
          </Form>
          <div className="d-flex align-items-center gap-3">
            <Button
              variant="link"
              className="text-decoration-none"
              onClick={() => dispatch(toggleTheme())}
            >
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="link" className="text-decoration-none text-dark">
                {i18n.language === 'vi' ? '🇻🇳' : '🇺🇸'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => changeLanguage('vi')}>Tiếng Việt</Dropdown.Item>
                <Dropdown.Item onClick={() => changeLanguage('en')}>English</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            {isAuthenticated ? (
              <>
                <Link to="/cart" className="position-relative text-decoration-none text-dark">
                  <FiShoppingCart size={24} />
                  {totalItems > 0 && (
                    <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle rounded-pill">
                      {totalItems}
                    </Badge>
                  )}
                </Link>
                <NotificationDropdown />
                <Link to="/profile/wishlist" className="text-decoration-none text-dark">
                  <FiHeart size={24} />
                </Link>
                <Dropdown>
                  <Dropdown.Toggle variant="link" className="text-decoration-none text-dark">
                    <FiUser size={24} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/profile">{t('nav.profile')}</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/profile/orders">{t('nav.orders')}</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/profile/bookings">{t('nav.bookings')}</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/profile/wishlist">{t('nav.wishlist')}</Dropdown.Item>
                    {user?.role === 'Admin' && (
                      <Dropdown.Item as={Link} to="/admin">{t('nav.admin')}</Dropdown.Item>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>{t('nav.logout')}</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Button variant="outline-dark" as={Link} to="/login" className="me-2">
                  {t('nav.login')}
                </Button>
                <Button variant="dark" as={Link} to="/register">
                  {t('nav.register')}
                </Button>
              </>
            )}
          </div>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
