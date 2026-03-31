import { useEffect } from 'react';
import { Dropdown, Badge, ListGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, getUnreadCount, markAsRead } from '../../store/slices/notificationSlice';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
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
    const nid = notification._id || notification.id;
    if (!notification.isRead && nid) {
      await dispatch(markAsRead(nid));
    }
    const t = String(notification.type || '').toLowerCase();
    if (t === 'order') {
      navigate('/profile/orders');
    } else if (t === 'booking') {
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
        <Dropdown.Header className="notification-dropdown-header">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <div>
              <div className="fw-semibold text-dark">Thông báo</div>
              <div className="notification-brand-sub small text-muted">ND Sports · ndsports.id.vn</div>
            </div>
            <span
              className="notification-view-all small"
              style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
              onClick={() => navigate('/profile/notifications')}
            >
              Xem tất cả
            </span>
          </div>
        </Dropdown.Header>
        {recentNotifications.length === 0 ? (
          <Dropdown.ItemText className="text-muted text-center py-4 px-3">
            Chưa có thông báo mới
          </Dropdown.ItemText>
        ) : (
          <ListGroup variant="flush">
            {recentNotifications.map((notification) => (
              <ListGroup.Item
                key={notification._id || notification.id}
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
                    <span className="badge rounded-pill ms-2 notification-unread-dot" />
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
