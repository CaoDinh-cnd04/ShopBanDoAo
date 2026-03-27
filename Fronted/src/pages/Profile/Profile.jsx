import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import {
  FiUser, FiPackage, FiCalendar, FiHeart,
  FiMapPin, FiLock, FiTag, FiBell, FiChevronRight
} from 'react-icons/fi';
import ProfileEdit from './ProfileEdit';
import Orders from './Orders';
import Bookings from './Bookings';
import Wishlist from './Wishlist';
import Addresses from './Addresses';
import ChangePassword from './ChangePassword';
import Vouchers from './Vouchers';
import Notifications from './Notifications';
import './Profile.css';

const NAV_ITEMS = [
  { key: 'profile',   label: 'Thông tin cá nhân', icon: FiUser,      route: '/profile' },
  { key: 'orders',    label: 'Đơn hàng của tôi',   icon: FiPackage,   route: '/profile/orders' },
  { key: 'bookings',  label: 'Lịch đặt sân',       icon: FiCalendar,  route: '/profile/bookings' },
  { key: 'wishlist',  label: 'Yêu thích',           icon: FiHeart,     route: '/profile/wishlist' },
  { key: 'addresses', label: 'Địa chỉ',             icon: FiMapPin,    route: '/profile/addresses' },
  { key: 'vouchers',  label: 'Voucher',             icon: FiTag,       route: '/profile/vouchers' },
  { key: 'password',  label: 'Đổi mật khẩu',       icon: FiLock,      route: '/profile/password' },
  { key: 'notifications', label: 'Thông báo',       icon: FiBell,      route: '/profile/notifications' },
];

const CONTENT_MAP = {
  profile:       <ProfileEdit />,
  orders:        <Orders />,
  bookings:      <Bookings />,
  wishlist:      <Wishlist />,
  addresses:     <Addresses />,
  vouchers:      <Vouchers />,
  password:      <ChangePassword />,
  notifications: <Notifications />,
};

const Profile = () => {
  const { user } = useSelector((s) => s.auth);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from route
  const pathKey = location.pathname.split('/profile/')[1];
  const activeKey = pathKey || 'profile';

  const handleNav = (item) => {
    if (item.route) navigate(item.route);
  };

  return (
    <div className="profile-page">
      <Container>
        <Row className="g-4">
          {/* Sidebar */}
          <Col lg={3} md={4}>
            <div className="profile-sidebar">
              {/* Avatar */}
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  {user?.fullName?.[0]?.toUpperCase() || <FiUser size={24} />}
                </div>
                <div>
                  <p className="profile-user-name">{user?.fullName || 'User'}</p>
                  <p className="profile-user-email">{user?.email}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="profile-nav">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.key === activeKey;
                  return (
                    <button
                      key={item.key}
                      className={`profile-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNav(item)}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                      {isActive && <FiChevronRight size={14} className="pni-chevron" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </Col>

          {/* Content */}
          <Col lg={9} md={8}>
            <motion.div
              key={activeKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="profile-content"
            >
              {CONTENT_MAP[activeKey] || <ProfileEdit />}
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Profile;
