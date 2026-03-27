import { useEffect } from 'react';
import { Dropdown, Badge, ListGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, getUnreadCount, markAsRead } from '../../store/slices/notificationSlice';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications: rawNotifications, unreadCount } = useSelector((state) => state.notifications);
  const notifications = Array.isArray(rawNotifications) ? rawNotifications : [];
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications());
      dispatch(getUnreadCount());
    }
  }, [dispatch, isAuthenticated]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await dispatch(markAsRead(notification.id));
    }
    // Navigate based on notification type
    if (notification.type === 'order') {
      navigate('/profile/orders');
    } else if (notification.type === 'booking') {
      navigate('/profile/bookings');
    }
  };

  if (!isAuthenticated) return null;

  const recentNotifications = notifications.slice(0, 5);

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="link" className="text-decoration-none text-dark position-relative">
        <FiBell size={24} />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            className="position-absolute top-0 start-100 translate-middle rounded-pill"
            style={{ fontSize: '10px' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-dropdown">
        <Dropdown.Header>
          <div className="d-flex justify-content-between align-items-center">
            <span>Notifications</span>
            <span
              className="text-primary small"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/profile/notifications')}
            >
              View All
            </span>
          </div>
        </Dropdown.Header>
        {recentNotifications.length === 0 ? (
          <Dropdown.ItemText className="text-muted text-center py-3">
            No notifications
          </Dropdown.ItemText>
        ) : (
          <ListGroup variant="flush">
            {recentNotifications.map((notification) => (
              <ListGroup.Item
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <strong>{notification.title}</strong>
                    <p className="mb-0 small text-muted">{notification.message}</p>
                    <small className="text-muted">
                      {new Date(notification.createdAt).toLocaleString()}
                    </small>
                  </div>
                  {!notification.isRead && (
                    <span className="badge bg-primary rounded-pill ms-2"></span>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationDropdown;
