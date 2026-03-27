import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiBell, FiCheck, FiCheckCircle, FiInfo, FiPackage, FiCalendar } from 'react-icons/fi';
import {
  fetchNotifications, markAsRead, markAllAsRead,
} from '../../store/slices/notificationSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';

const TYPE_ICONS = {
  order: FiPackage,
  booking: FiCalendar,
  info: FiInfo,
  default: FiBell,
};

const fmtTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const Notifications = () => {
  const dispatch = useDispatch();
  const { notifications, isLoading, unreadCount } = useSelector((s) => s.notifications);
  const safeNotifs = Array.isArray(notifications) ? notifications : [];

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  const handleRead = (id) => dispatch(markAsRead(id));

  const handleReadAll = async () => {
    const result = await dispatch(markAllAsRead());
    if (markAllAsRead.fulfilled.match(result)) {
      toast.success('Đã đánh dấu tất cả là đã đọc');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="profile-section-card">
      <div className="profile-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="profile-section-title-row">
            <FiBell size={20} />
            <h2 className="profile-section-title">Thông báo</h2>
          </div>
          <p className="profile-section-sub">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã đọc'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="profile-btn-secondary" onClick={handleReadAll}>
            <FiCheckCircle size={14} /> Đọc tất cả
          </button>
        )}
      </div>

      {safeNotifs.length === 0 ? (
        <div className="profile-empty-state">
          <FiBell size={48} />
          <p>Bạn chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="notif-list">
          {safeNotifs.map((n) => {
            const TypeIcon = TYPE_ICONS[n.type] || TYPE_ICONS.default;
            return (
              <motion.div
                key={n._id || n.id}
                className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => !n.isRead && handleRead(n._id || n.id)}
              >
                <div className={`notif-icon ${n.isRead ? '' : 'active'}`}>
                  <TypeIcon size={16} />
                </div>
                <div className="notif-body">
                  <div className="notif-title">{n.title || 'Thông báo'}</div>
                  <div className="notif-message">{n.message || n.content}</div>
                  <div className="notif-time">{fmtTime(n.createdAt)}</div>
                </div>
                {!n.isRead && (
                  <div className="notif-unread-dot" title="Đánh dấu đã đọc">
                    <FiCheck size={12} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
