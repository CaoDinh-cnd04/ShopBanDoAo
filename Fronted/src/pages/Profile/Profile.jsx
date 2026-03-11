import { useState } from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileEdit from './ProfileEdit';
import Orders from './Orders';
import Bookings from './Bookings';
import Wishlist from './Wishlist';
import Addresses from './Addresses';
import ChangePassword from './ChangePassword';
import Vouchers from './Vouchers';
import Notifications from './Notifications';

const TAB_KEYS_WITH_ROUTES = ['orders', 'bookings', 'wishlist', 'notifications'];

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const [localTab, setLocalTab] = useState('profile');
  const isNotificationsRoute = location.pathname.endsWith('/notifications');
  const activeKey = isNotificationsRoute ? 'notifications' : localTab;

  const handleSelectTab = (key) => {
    if (TAB_KEYS_WITH_ROUTES.includes(key)) {
      navigate(`/profile/${key}`);
    } else {
      setLocalTab(key);
      if (key === 'profile') navigate('/profile');
    }
  };

  return (
    <Container className="py-5">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fw-bold mb-4 gradient-text"
        style={{ fontSize: '2.5rem' }}
      >
        {t('profile.title')}
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs activeKey={activeKey} onSelect={handleSelectTab} className="mb-4">
        <Tab eventKey="profile" title={t('profile.edit')}>
          <ProfileEdit />
        </Tab>
        <Tab eventKey="password" title="Change Password">
          <ChangePassword />
        </Tab>
        <Tab eventKey="addresses" title={t('profile.addresses')}>
          <Addresses />
        </Tab>
        <Tab eventKey="orders" title={t('profile.orders')}>
          <Orders />
        </Tab>
        <Tab eventKey="bookings" title={t('profile.bookings')}>
          <Bookings />
        </Tab>
        <Tab eventKey="wishlist" title={t('profile.wishlist')}>
          <Wishlist />
        </Tab>
        <Tab eventKey="vouchers" title="Vouchers">
          <Vouchers />
        </Tab>
        <Tab eventKey="notifications" title="Notifications">
          <Notifications />
        </Tab>
      </Tabs>
      </motion.div>
    </Container>
  );
};

export default Profile;
