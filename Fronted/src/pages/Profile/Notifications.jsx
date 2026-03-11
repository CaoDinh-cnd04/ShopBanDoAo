import { useEffect } from 'react';
import { Card, ListGroup, Button, Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from '../../store/slices/notificationSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';
import './Notifications.css';

const Notifications = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { notifications, isLoading } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAsRead = async (id) => {
    await dispatch(markAsRead(id));
  };

  const handleMarkAllAsRead = async () => {
    const result = await dispatch(markAllAsRead());
    if (markAllAsRead.fulfilled.match(result)) {
      toast.success('All notifications marked as read');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Notifications</h5>
        {notifications.length > 0 && (
          <Button variant="outline-primary" size="sm" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {notifications.length === 0 ? (
          <p className="text-muted text-center py-5">No notifications</p>
        ) : (
          <ListGroup variant="flush">
            {notifications.map((notification) => (
              <ListGroup.Item
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleMarkAsRead(notification.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <strong>{notification.title}</strong>
                      {!notification.isRead && (
                        <Badge bg="primary" className="rounded-pill">New</Badge>
                      )}
                    </div>
                    <p className="mb-1">{notification.message}</p>
                    <small className="text-muted">
                      {new Date(notification.createdAt).toLocaleString()}
                    </small>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default Notifications;
