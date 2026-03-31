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
  FiTag,
  FiImage
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import './AdminLayout.css';

const matchNavPath = (pathname, item) => {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

const resolvePageTitle = (pathname, groups) => {
  const items = groups.flatMap((g) => g.items);
  const matches = items.filter((i) => matchNavPath(pathname, i));
  if (matches.length === 0) return 'Quản trị';
  return [...matches].sort((a, b) => b.to.length - a.to.length)[0].label;
};

const navGroups = [
  {
    title: 'Tổng quan',
    items: [{ to: '/admin', end: true, icon: FiBarChart2, label: 'Dashboard' }]
  },
  {
    title: 'Bán hàng',
    items: [
      { to: '/admin/products', end: false, icon: FiPackage, label: 'Sản phẩm' },
      { to: '/admin/categories', end: false, icon: FiLayers, label: 'Danh mục & thương hiệu' },
      { to: '/admin/orders', end: false, icon: FiShoppingCart, label: 'Đơn hàng' },
      { to: '/admin/vouchers', end: false, icon: FiTag, label: 'Voucher' }
    ]
  },
  {
    title: 'Vận hành',
    items: [
      { to: '/admin/bookings', end: false, icon: FiCalendar, label: 'Đặt sân' },
      { to: '/admin/courts', end: false, icon: FiMapPin, label: 'Sân' },
      { to: '/admin/banner', end: false, icon: FiImage, label: 'Banner trang chủ' }
    ]
  },
  {
    title: 'Người dùng & nội dung',
    items: [
      { to: '/admin/users', end: false, icon: FiUsers, label: 'Người dùng' },
      { to: '/admin/reviews', end: false, icon: FiStar, label: 'Đánh giá' }
    ]
  }
];

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

  const closeSidebarOnNavigate = () => setSidebarOpen(false);

  const pageTitle = useMemo(() => resolvePageTitle(location.pathname, navGroups), [location.pathname]);

  return (
    <div className="admin-shell">
      <button
        type="button"
        className={`admin-overlay ${sidebarOpen ? 'is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Đóng menu"
      />

      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar-head">
          <Link to="/admin" className="admin-brand" onClick={closeSidebarOnNavigate}>
            <span className="admin-brand-mark">S</span>
            <span className="admin-brand-text">
              <span className="admin-brand-title">Sports Shop</span>
              <span className="admin-brand-sub">Admin</span>
            </span>
          </Link>
          <button
            type="button"
            className="admin-sidebar-close d-lg-none"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <FiX size={18} />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Menu quản trị">
          {navGroups.map((group) => (
            <div key={group.title} className="admin-nav-group">
              <div className="admin-nav-group-title">{group.title}</div>
              {group.items.map(({ to, end, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
                  onClick={closeSidebarOnNavigate}
                >
                  <Icon className="admin-nav-icon" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <div className="admin-user">
            <div className="admin-user-avatar">{(user?.fullName || user?.email || 'A').slice(0, 1).toUpperCase()}</div>
            <div className="admin-user-meta">
              <div className="admin-user-name">{user?.fullName || user?.username || user?.email || 'Admin'}</div>
              <div className="admin-user-sub">{user?.email || ' '}</div>
            </div>
          </div>
          <Button variant="outline-danger" className="w-100" onClick={handleLogout}>
            <FiLogOut className="me-2" /> Đăng xuất
          </Button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button type="button" className="admin-burger d-lg-none" onClick={() => setSidebarOpen(true)} aria-label="Mở menu">
              <FiMenu size={18} />
            </button>
            <nav className="admin-breadcrumb" aria-label="Breadcrumb">
              <Link to="/admin" onClick={closeSidebarOnNavigate}>
                Quản trị
              </Link>
              <span className="admin-breadcrumb-sep">/</span>
              <span className="admin-breadcrumb-current">{pageTitle}</span>
            </nav>
          </div>

          <div className="admin-topbar-actions">
            <Link to="/" className="admin-link-home">
              <FiHome size={16} /> Về trang chủ
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
