import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import {
  FiBarChart2,
  FiPackage,
  FiShoppingCart,
  FiCalendar,
  FiUsers,
  FiStar,
  FiLogOut,
  FiHome,
  FiMenu,
  FiX,
  FiLayers,
  FiMapPin,
  FiTag
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import './AdminLayout.css';

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const navItems = useMemo(
    () => [
      { to: '/admin', end: true, icon: FiBarChart2, label: 'Tổng quan' },
      { to: '/admin/products', end: false, icon: FiPackage, label: 'Sản phẩm' },
      { to: '/admin/categories', end: false, icon: FiLayers, label: 'Danh mục & thương hiệu' },
      { to: '/admin/orders', end: false, icon: FiShoppingCart, label: 'Đơn hàng' },
      { to: '/admin/bookings', end: false, icon: FiCalendar, label: 'Đặt sân' },
      { to: '/admin/courts', end: false, icon: FiMapPin, label: 'Sân' },
      { to: '/admin/vouchers', end: false, icon: FiTag, label: 'Voucher' },
      { to: '/admin/users', end: false, icon: FiUsers, label: 'Người dùng' },
      { to: '/admin/reviews', end: false, icon: FiStar, label: 'Đánh giá' },
    ],
    []
  );

  const closeSidebarOnNavigate = () => setSidebarOpen(false);

  const pageTitle = useMemo(() => {
    const found = navItems.find((i) => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)));
    return found?.label || 'Quản trị';
  }, [location.pathname, navItems]);

  return (
    <div className="admin-shell">
      {/* Mobile overlay */}
      <button
        type="button"
        className={`admin-overlay ${sidebarOpen ? 'is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close sidebar"
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-top">
          <Link to="/admin" className="admin-logo" onClick={closeSidebarOnNavigate}>
            <span className="admin-logo-mark">S</span>
            <span className="admin-logo-text">SPORTS Admin</span>
          </Link>
          <button
            type="button"
            className="admin-sidebar-close d-lg-none"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FiX size={18} />
          </button>
        </div>

        <nav className="admin-nav">
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebarOnNavigate}
            >
              <Icon size={18} className="admin-nav-icon" />
              <span className="admin-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-user">
            <div className="admin-user-avatar">{(user?.fullName || user?.email || 'A').slice(0, 1).toUpperCase()}</div>
            <div className="admin-user-meta">
              <div className="admin-user-name">{user?.fullName || user?.username || user?.email || 'Admin'}</div>
              <div className="admin-user-sub">{user?.email || ''}</div>
            </div>
          </div>
          <Button variant="outline-danger" className="admin-logout" onClick={handleLogout}>
            <FiLogOut className="me-2" /> Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-burger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <FiMenu size={18} />
            </button>
            <div className="admin-breadcrumb">
              <span className="admin-breadcrumb-title">{pageTitle}</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            <Link to="/" className="admin-home">
              <FiHome className="me-2" /> Về trang chủ
            </Link>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
