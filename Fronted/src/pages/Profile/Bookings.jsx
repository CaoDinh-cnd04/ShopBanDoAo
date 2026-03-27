import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar, FiSearch, FiX, FiEye, FiMapPin,
  FiClock, FiCheck, FiXCircle, FiAlertCircle,
} from 'react-icons/fi';
import { fetchUserBookings, cancelBooking } from '../../store/slices/bookingSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';

const STATUS_CONFIG = {
  pending:   { label: 'Chờ xác nhận', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: FiClock },
  confirmed: { label: 'Đã xác nhận',  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: FiCheck },
  completed: { label: 'Hoàn thành',   color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: FiCheck },
  cancelled: { label: 'Đã hủy',       color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: FiXCircle },
};

const getStatusConfig = (status) => {
  if (!status) return { label: 'Không rõ', color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: FiAlertCircle };
  const key = status.toLowerCase().replace(/\s+/g, '');
  const map = {
    pending: 'pending', 'chờxácnhận': 'pending',
    confirmed: 'confirmed', 'đãxácnhận': 'confirmed',
    completed: 'completed', 'hoànthành': 'completed',
    cancelled: 'cancelled', 'đãhủy': 'cancelled',
  };
  return STATUS_CONFIG[map[key]] || { label: status, color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: FiAlertCircle };
};

const fmtMoney = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const ConfirmModal = ({ booking, onConfirm, onClose }) => (
  <AnimatePresence>
    <motion.div
      className="pf-modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="pf-modal"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pf-modal-icon danger"><FiXCircle size={28} /></div>
        <h3 className="pf-modal-title">Xác nhận hủy đặt sân</h3>
        <p className="pf-modal-desc">
          Bạn có chắc muốn hủy lịch đặt sân này? Hành động này không thể hoàn tác.
        </p>
        <div className="pf-modal-actions">
          <button className="profile-btn-secondary" onClick={onClose}>Đóng</button>
          <button className="profile-btn-danger" onClick={onConfirm}>Xác nhận hủy</button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const BookingRow = ({ booking, onCancel }) => {
  const status = booking.bookingStatus || booking.status || booking.Status || '';
  const cfg = getStatusConfig(status);
  const StatusIcon = cfg.icon;
  const id = booking._id || booking.id;
  const courtName = booking.courtId?.courtName || booking.court?.courtName || booking.court?.CourtName || 'Sân thể thao';
  const location = booking.courtId?.location || booking.court?.location || booking.court?.Location || '';
  const date = booking.bookingDate || booking.BookingDate;
  const total = booking.totalAmount || booking.TotalAmount || 0;
  const canCancel = ['pending', 'chờ xác nhận'].includes(status.toLowerCase());

  return (
    <motion.div
      className="order-row"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="order-row-left">
        <div className="order-icon-wrap booking">
          <FiCalendar size={18} />
        </div>
        <div>
          <div className="order-id">{courtName}</div>
          <div className="order-meta">
            <FiClock size={11} /> {fmtDate(date)}
            {location && <><FiMapPin size={11} style={{ marginLeft: 8 }} /> {location}</>}
          </div>
        </div>
      </div>

      <div className="order-row-right">
        <div className="order-total">{fmtMoney(total)}</div>
        <span className="order-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
          <StatusIcon size={12} /> {cfg.label}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="order-detail-btn"
            onClick={() => window.location.assign(`/profile/bookings/${id}`)}
          >
            <FiEye size={14} /> Chi tiết
          </button>
          {canCancel && (
            <button className="order-cancel-btn" onClick={() => onCancel(id)}>
              <FiXCircle size={14} /> Hủy
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Bookings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { bookings, isLoading } = useSelector((s) => s.bookings);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [cancelId, setCancelId] = useState(null);

  useEffect(() => { dispatch(fetchUserBookings()); }, [dispatch]);

  const handleCancel = async () => {
    const result = await dispatch(cancelBooking(cancelId));
    if (cancelBooking.fulfilled.match(result)) {
      toast.success('Đã hủy lịch đặt sân thành công');
    } else {
      toast.error(result.payload || 'Không thể hủy lịch đặt sân');
    }
    setCancelId(null);
  };

  const filtered = (Array.isArray(bookings) ? bookings : []).filter((b) => {
    const status = (b.bookingStatus || b.status || b.Status || '').toLowerCase();
    const name = (b.courtId?.courtName || b.court?.courtName || '').toLowerCase();
    const matchStatus = filter === 'all' || status.includes(filter);
    const matchSearch = !search || name.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }).sort((a, b) => new Date(b.bookingDate || b.createdAt) - new Date(a.bookingDate || a.createdAt));

  if (isLoading) return <Loading />;

  return (
    <div className="profile-section-card">
      <div className="profile-section-header">
        <div className="profile-section-title-row">
          <FiCalendar size={20} />
          <h2 className="profile-section-title">Lịch đặt sân</h2>
        </div>
        <p className="profile-section-sub">{bookings?.length || 0} lịch đặt</p>
      </div>

      <div className="pf-filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`pf-filter-tab ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="pf-search-wrap">
        <FiSearch size={15} className="pf-search-icon" />
        <input
          className="pf-search-input"
          placeholder="Tìm theo tên sân..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="pf-search-clear" onClick={() => setSearch('')}>
            <FiX size={14} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="profile-empty-state">
          <FiCalendar size={48} />
          <p>{search || filter !== 'all' ? 'Không tìm thấy lịch đặt phù hợp' : 'Bạn chưa đặt sân nào'}</p>
          {!search && filter === 'all' && (
            <button className="profile-btn-primary" onClick={() => navigate('/courts')}>
              Xem sân ngay
            </button>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map((b) => (
            <BookingRow key={b._id || b.id} booking={b} onCancel={setCancelId} />
          ))}
        </div>
      )}

      {cancelId && (
        <ConfirmModal
          onConfirm={handleCancel}
          onClose={() => setCancelId(null)}
        />
      )}
    </div>
  );
};

export default Bookings;
