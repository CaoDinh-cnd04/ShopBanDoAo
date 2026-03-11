import { Card } from 'react-bootstrap';

const NotificationItem = ({ notification, onClick }) => {
    const getIcon = (type) => {
        const icons = {
            order: 'cart-check-fill',
            booking: 'calendar-check-fill',
            promotion: 'gift-fill',
            system: 'info-circle-fill'
        };
        return icons[type] || 'bell-fill';
    };

    const getIconColor = (type) => {
        const colors = {
            order: 'text-success',
            booking: 'text-primary',
            promotion: 'text-warning',
            system: 'text-info'
        };
        return colors[type] || 'text-secondary';
    };

    return (
        <Card
            className={`mb-2 notification-item ${!notification.IsRead ? 'unread' : ''}`}
            onClick={() => onClick(notification)}
            style={{ cursor: 'pointer' }}
        >
            <Card.Body className="d-flex align-items-start p-3">
                <div className={`me-3 ${getIconColor(notification.Type)}`}>
                    <i className={`bi bi-${getIcon(notification.Type)}`} style={{ fontSize: '1.5rem' }}></i>
                </div>
                <div className="flex-grow-1">
                    <h6 className="mb-1 fw-bold">{notification.Title}</h6>
                    <p className="mb-1 small text-muted">{notification.Message}</p>
                    <small className="text-muted">
                        {new Date(notification.CreatedDate).toLocaleString('vi-VN')}
                    </small>
                </div>
                {!notification.IsRead && (
                    <div className="ms-2">
                        <span className="badge bg-primary rounded-circle" style={{ width: '10px', height: '10px' }}></span>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default NotificationItem;
