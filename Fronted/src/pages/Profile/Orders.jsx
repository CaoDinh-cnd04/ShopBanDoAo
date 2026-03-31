import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  FiShoppingBag, FiSearch, FiX, FiEye, FiPackage,
  FiClock, FiCheck, FiTruck, FiXCircle,
} from 'react-icons/fi';
import { fetchUserOrders, cancelOrder } from '../../store/slices/orderSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { clearCart, fetchCart } from '../../store/slices/cartSlice';
import Loading from '../../components/Loading/Loading';

const STATUS_CONFIG = {
  pending:   { label: 'Chờ xác nhận', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: FiClock },
  vnpaywait: { label: 'Chờ thanh toán VNPay', color: '#D97706', bg: 'rgba(217,119,6,0.14)', icon: FiClock },
  confirmed: { label: 'Đã xác nhận',  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: FiCheck },
  shipping:  { label: 'Đang giao',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: FiTruck },
  delivered: { label: 'Đã giao',      color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: FiCheck },
  cancelled: { label: 'Đã hủy',       color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: FiXCircle },
};

const getStatusConfig = (status) => {
  if (!status) return { label: 'Không rõ', color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: FiPackage };
  const key = status.toLowerCase().replace(/\s+/g, '');
  const map = {
    pending: 'pending', 'chờxácnhận': 'pending',
    awaitingpayment: 'vnpaywait',
    confirmed: 'confirmed', 'đãxácnhận': 'confirmed',
    shipping: 'shipping', 'đanggiao': 'shipping',
    delivered: 'delivered', 'đãgiao': 'delivered',
    cancelled: 'cancelled', 'đãhủy': 'cancelled',
  };
  return STATUS_CONFIG[map[key]] || { label: status, color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: FiPackage };
};

const fmtMoney = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const OrderRow = ({ order, onClick, onCancel }) => {
  const status = order.orderStatus || order.status || order.Status || '';
  const cfg = getStatusConfig(status);
  const StatusIcon = cfg.icon;
  const id = order._id || order.id;
  const total = order.totalAmount || order.TotalAmount || 0;
  const date = order.createdAt || order.orderDate || order.OrderDate;
  const items = Array.isArray(order.items) ? order.items : [];
  const stTrim = String(status).trim();
  const canCancel = stTrim === 'Pending' || stTrim === 'AwaitingPayment';

  return (
    <motion.div
      className="order-row"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
    >
      <div className="order-row-left">
        <div className="order-icon-wrap">
          <FiShoppingBag size={18} />
        </div>
        <div>
          <div className="order-id">Đơn #{String(id).slice(-8).toUpperCase()}</div>
          <div className="order-meta">
            {fmtDate(date)}
            {items.length > 0 && <span> · {items.length} sản phẩm</span>}
          </div>
          {items.length > 0 && (
            <div className="order-items-preview">
              {items.slice(0, 2).map((item, i) => (
                <span key={i} className="order-item-tag">
                  {item.productName || item.ProductName || 'Sản phẩm'}
                </span>
              ))}
              {items.length > 2 && <span className="order-item-tag muted">+{items.length - 2}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="order-row-right">
        <div className="order-total">{fmtMoney(total)}</div>
        <span className="order-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
          <StatusIcon size={12} /> {cfg.label}
        </span>
        <div className="order-row-actions" onClick={(e) => e.stopPropagation()}>
          {canCancel && onCancel && (
            <button
              type="button"
              className="order-cancel-btn"
              onClick={() => onCancel(id)}
            >
              Hủy đơn
            </button>
          )}
          <button type="button" className="order-detail-btn" onClick={onClick}>
            <FiEye size={14} /> Chi tiết
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentSuccessHandled = useRef(false);
  const { orders, isLoading } = useSelector((s) => s.orders);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { dispatch(fetchUserOrders()); }, [dispatch]);

  /** Sau khi VNPay redirect về /profile/orders?payment=success (hoặc /profile/orders/:id?payment=success) */
  useEffect(() => {
    if (paymentSuccessHandled.current) return;
    if (searchParams.get('payment') !== 'success') return;
    paymentSuccessHandled.current = true;
    toast.success('Thanh toán VNPay thành công. Đơn hàng đã được ghi nhận trong lịch sử.');
    setSearchParams({}, { replace: true });
    dispatch(clearCart());
    dispatch(fetchCart());
    dispatch(fetchUserOrders());
    dispatch(fetchNotifications());
  }, [searchParams, setSearchParams, dispatch]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này? Chỉ áp dụng khi shop chưa xác nhận.')) return;
    const res = await dispatch(cancelOrder(orderId));
    if (cancelOrder.fulfilled.match(res)) {
      toast.success('Đã hủy đơn hàng');
      dispatch(fetchUserOrders());
    } else {
      toast.error(res.payload || 'Không thể hủy đơn');
    }
  };

  const filtered = (Array.isArray(orders) ? orders : []).filter((o) => {
    const status = (o.orderStatus || o.status || o.Status || '').toLowerCase();
    const id = String(o._id || o.id || '').toLowerCase();
    const matchStatus = filter === 'all' || status.includes(filter);
    const matchSearch = !search || id.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }).sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate));

  if (isLoading) return <Loading />;

  return (
    <div className="profile-section-card">
      <div className="profile-section-header">
        <div className="profile-section-title-row">
          <FiShoppingBag size={20} />
          <h2 className="profile-section-title">Đơn hàng của tôi</h2>
        </div>
        <p className="profile-section-sub">{orders?.length || 0} đơn hàng</p>
      </div>

      {/* Filter tabs */}
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

      {/* Search */}
      <div className="pf-search-wrap">
        <FiSearch size={15} className="pf-search-icon" />
        <input
          className="pf-search-input"
          placeholder="Tìm theo mã đơn hàng..."
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
          <FiShoppingBag size={48} />
          <p>{search || filter !== 'all' ? 'Không tìm thấy đơn hàng phù hợp' : 'Bạn chưa có đơn hàng nào'}</p>
          {!search && filter === 'all' && (
            <button className="profile-btn-primary" onClick={() => navigate('/products')}>
              Mua sắm ngay
            </button>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map((order) => (
            <OrderRow
              key={order._id || order.id}
              order={order}
              onClick={() => navigate(`/profile/orders/${order._id || order.id}`)}
              onCancel={handleCancelOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
