import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Dropdown } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  FiSearch, FiShoppingCart, FiUser, FiHeart,
  FiMoon, FiSun, FiMenu, FiX, FiChevronDown,
  FiLogOut, FiSettings, FiPackage, FiCalendar
} from 'react-icons/fi';
import { logout, isAdminUser } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { setFilters } from '../../store/slices/productSlice';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'nav.home' },
  { to: '/products', label: 'nav.products' },
  { to: '/courts', label: 'nav.courts' },
];

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const { totalItems } = useSelector((s) => s.cart);
  const { theme } = useSelector((s) => s.theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);

  /* Scroll effect */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close mobile on route change */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  /* Auto-focus search input */
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      dispatch(setFilters({ search: searchQuery }));
      navigate('/products');
      setSearchOpen(false);
      setSearchQuery('');
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

  const isActive = (to) => location.pathname === to;

  return (
    <>
      <header className={`navbar-premium ${scrolled ? 'navbar-scrolled' : ''} ${theme === 'dark' ? 'dark' : ''}`}>
        <Container className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <motion.span
              className="logo-icon"
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >⚡</motion.span>
            <span className="logo-text">SPORTS</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="navbar-nav-desktop">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link-premium ${isActive(to) ? 'active' : ''}`}
              >
                {t(label)}
                {isActive(to) && (
                  <motion.span
                    className="nav-active-dot"
                    layoutId="nav-dot"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="navbar-actions">
            {/* Search toggle */}
            <motion.button
              className="action-btn"
              onClick={() => setSearchOpen((v) => !v)}
              whileTap={{ scale: 0.92 }}
              aria-label="Search"
            >
              {searchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
            </motion.button>

            {/* Theme toggle */}
            <motion.button
              className="action-btn"
              onClick={() => dispatch(toggleTheme())}
              whileTap={{ scale: 0.92 }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </motion.button>

            {/* Language */}
            <Dropdown>
              <Dropdown.Toggle as="button" className="action-btn lang-btn">
                {i18n.language === 'vi' ? '🇻🇳' : '🇺🇸'}
              </Dropdown.Toggle>
              <Dropdown.Menu className="dropdown-premium">
                <Dropdown.Item onClick={() => changeLanguage('vi')}>🇻🇳 Tiếng Việt</Dropdown.Item>
                <Dropdown.Item onClick={() => changeLanguage('en')}>🇺🇸 English</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {isAuthenticated ? (
              <>
                {/* Wishlist */}
                <motion.div whileTap={{ scale: 0.92 }}>
                  <Link to="/profile/wishlist" className="action-btn" aria-label="Wishlist">
                    <FiHeart size={20} />
                  </Link>
                </motion.div>

                {/* Cart */}
                <motion.div whileTap={{ scale: 0.92 }} style={{ position: 'relative' }}>
                  <Link to="/cart" className="action-btn" aria-label="Cart">
                    <FiShoppingCart size={20} />
                    {totalItems > 0 && (
                      <motion.span
                        className="cart-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        key={totalItems}
                      >
                        {totalItems > 99 ? '99+' : totalItems}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>

                {/* Notifications */}
                <NotificationDropdown />

                {/* User menu */}
                <Dropdown>
                  <Dropdown.Toggle as="div" className="user-avatar-btn">
                    <div className="avatar-circle">
                      {user?.fullName?.[0]?.toUpperCase() || <FiUser size={16} />}
                    </div>
                    <FiChevronDown size={14} className="avatar-chevron" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="dropdown-premium user-dropdown" align="end">
                    <div className="dropdown-user-header">
                      <div className="dropdown-avatar">{user?.fullName?.[0]?.toUpperCase() || '?'}</div>
                      <div>
                        <div className="dropdown-user-name">{user?.fullName || 'User'}</div>
                        <div className="dropdown-user-email">{user?.email}</div>
                      </div>
                    </div>
                    <Dropdown.Divider />
                    <Dropdown.Item as={Link} to="/profile">
                      <FiSettings size={15} /> {t('nav.profile')}
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/profile/orders">
                      <FiPackage size={15} /> {t('nav.orders')}
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/profile/bookings">
                      <FiCalendar size={15} /> {t('nav.bookings')}
                    </Dropdown.Item>
                    {isAdminUser(user) && (
                      <Dropdown.Item as={Link} to="/admin">
                        🛡️ Admin Panel
                      </Dropdown.Item>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="logout-item">
                      <FiLogOut size={15} /> {t('nav.logout')}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">{t('nav.login')}</Link>
                <Link to="/register" className="btn-register">{t('nav.register')}</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <motion.button
              className="action-btn mobile-menu-btn"
              onClick={() => setMobileOpen((v) => !v)}
              whileTap={{ scale: 0.92 }}
              aria-label="Menu"
            >
              {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </motion.button>
          </div>
        </Container>

        {/* Search Bar (expanded) */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              className="search-bar-expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Container>
                <form className="search-form" onSubmit={handleSearch}>
                  <FiSearch className="search-icon" size={18} />
                  <input
                    ref={searchRef}
                    type="text"
                    className="search-input"
                    placeholder="Tìm sản phẩm, sân thể thao..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="search-submit">Tìm kiếm</button>
                </form>
              </Container>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              className={`mobile-drawer ${theme === 'dark' ? 'dark' : ''}`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="mobile-drawer-header">
                <span className="logo-text">⚡ SPORTS</span>
                <button className="action-btn" onClick={() => setMobileOpen(false)}>
                  <FiX size={22} />
                </button>
              </div>
              <div className="mobile-drawer-nav">
                {NAV_LINKS.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`mobile-nav-link ${isActive(to) ? 'active' : ''}`}
                  >
                    {t(label)}
                  </Link>
                ))}
              </div>
              <div className="mobile-drawer-footer">
                {isAuthenticated ? (
                  <button className="mobile-logout" onClick={handleLogout}>
                    <FiLogOut /> Đăng xuất
                  </button>
                ) : (
                  <div className="mobile-auth">
                    <Link to="/login" className="btn-login w-100 text-center">Đăng nhập</Link>
                    <Link to="/register" className="btn-register w-100 text-center">Đăng ký</Link>
                  </div>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
