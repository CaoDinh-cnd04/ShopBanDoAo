import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight, FiTag } from 'react-icons/fi';
import { fetchCart, updateCartItem, removeFromCart, clearCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import api from '../../services/api';
import './Cart.css';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, subtotal, isLoading } = useSelector((s) => s.cart);
  const { isAuthenticated } = useSelector((s) => s.auth);

  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cartVoucher');
      if (raw) setAppliedVoucher(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const updateQty = (productId, qty, variantId) => {
    if (qty <= 0) {
      dispatch(removeFromCart({ productId, variantId }));
      toast.info('Đã xoá sản phẩm');
    } else {
      dispatch(updateCartItem({ productId, quantity: qty, variantId }));
    }
  };

  const handleRemove = (productId, variantId) => {
    dispatch(removeFromCart({ productId, variantId }));
    toast.success('Đã xoá khỏi giỏ');
  };

  const safeItems = Array.isArray(items) ? items : [];
  const shipping = subtotal > 500000 ? 0 : 30000;
  const rawDiscount = appliedVoucher?.discountAmount != null ? Number(appliedVoucher.discountAmount) : 0;
  const discount = Math.min(Math.max(0, rawDiscount), subtotal || 0);
  const total = Math.max(0, (subtotal || 0) - discount + shipping);

  const handleApplyVoucher = async () => {
    const code = voucherInput.trim();
    if (!code) {
      toast.warn('Nhập mã giảm giá');
      return;
    }
    if (!isAuthenticated) {
      toast.warn('Vui lòng đăng nhập để áp dụng mã');
      return;
    }
    try {
      setVoucherLoading(true);
      const res = await api.post('/vouchers/apply', {
        code: code.toUpperCase(),
        orderValue: Number(subtotal) || 0,
      });
      const d = res.data?.data;
      const next = {
        code: d.voucherCode,
        discountAmount: d.discountAmount,
        name: d.voucherName || '',
      };
      setAppliedVoucher(next);
      sessionStorage.setItem('cartVoucher', JSON.stringify(next));
      toast.success(res.data?.message || 'Đã áp dụng mã giảm giá');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không áp dụng được mã');
    } finally {
      setVoucherLoading(false);
    }
  };

  const clearVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    sessionStorage.removeItem('cartVoucher');
  };

  if (isLoading) return <Loading />;

  if (safeItems.length === 0) {
    return (
      <div className="cart-empty-page">
        <motion.div
          className="cart-empty-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="cart-empty-icon">🛒</div>
          <h2>Giỏ hàng trống</h2>
          <p>Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
          <button className="auth-submit-btn" style={{ width: 'auto', paddingInline: '2rem' }} onClick={() => navigate('/products')}>
            <FiShoppingBag size={18} /> Tiếp tục mua sắm
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Container>
        {/* Header */}
        <div className="cart-header">
          <h1 className="cart-title">Giỏ hàng <span className="cart-count">({safeItems.length})</span></h1>
          <button className="cart-clear-btn" onClick={() => { dispatch(clearCart()); toast.success('Đã xoá giỏ hàng'); }}>
            Xoá tất cả
          </button>
        </div>

        <Row className="g-4">
          {/* Items */}
          <Col lg={8}>
            <div className="cart-items-card">
              <AnimatePresence>
                {safeItems.map((item) => {
                  const pid = item.productId;
                  const img = resolveMediaUrl(item.image) || '/placeholder.jpg';
                  const price = item.price || 0;
                  const vid = item.variantId;
                  const lineKey = `${pid}-${vid || 'base'}`;
                  return (
                    <motion.div
                      key={lineKey}
                      className="cart-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      {/* Image */}
                      <Link to={`/products/${pid}`} className="cart-item-img-link">
                        <img src={img} alt={item.productName} onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }} />
                      </Link>

                      {/* Info */}
                      <div className="cart-item-info">
                        <Link to={`/products/${pid}`} className="cart-item-name">
                          {item.productName}
                        </Link>
                        {item.variantLabel && (
                          <div className="cart-item-variant">{item.variantLabel}</div>
                        )}
                        <div className="cart-item-price-mobile">{fmt(price)}</div>
                      </div>

                      {/* Quantity */}
                      <div className="cart-qty-ctrl">
                        <button className="qty-btn" onClick={() => updateQty(pid, item.quantity - 1, vid)}>
                          <FiMinus size={14} />
                        </button>
                        <span className="qty-num">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQty(pid, item.quantity + 1, vid)}>
                          <FiPlus size={14} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="cart-item-subtotal">{fmt(price * item.quantity)}</div>

                      {/* Remove */}
                      <motion.button
                        className="cart-remove-btn"
                        onClick={() => handleRemove(pid, vid)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FiTrash2 size={16} />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </Col>

          {/* Summary */}
          <Col lg={4}>
            <div className="cart-summary-card">
              <h3 className="summary-title">Tóm tắt đơn hàng</h3>

              {/* Voucher */}
              <div className="voucher-input-wrap">
                <FiTag size={15} className="voucher-icon" />
                <input
                  className="voucher-input"
                  placeholder="Mã giảm giá..."
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyVoucher())}
                  disabled={voucherLoading}
                />
                <button type="button" className="voucher-apply" onClick={handleApplyVoucher} disabled={voucherLoading}>
                  {voucherLoading ? '…' : 'Áp dụng'}
                </button>
              </div>
              {appliedVoucher && (
                <div className="voucher-applied small text-success mb-2 d-flex justify-content-between align-items-center">
                  <span>
                    Đã áp dụng <strong>{appliedVoucher.code}</strong>
                    {appliedVoucher.name ? ` — ${appliedVoucher.name}` : ''} (−{fmt(discount)})
                  </span>
                  <button type="button" className="voucher-remove" onClick={clearVoucher}>
                    Gỡ
                  </button>
                </div>
              )}

              <div className="summary-rows">
                <div className="summary-row">
                  <span>Tạm tính</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Vận chuyển</span>
                  <span className={shipping === 0 ? 'text-success fw-bold' : ''}>{shipping === 0 ? 'Miễn phí 🎉' : fmt(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="summary-row text-success">
                    <span>Giảm giá (voucher)</span>
                    <span>−{fmt(discount)}</span>
                  </div>
                )}
                {shipping === 0 && (
                  <p className="shipping-note">Đơn trên 500K được miễn phí vận chuyển</p>
                )}
                <hr className="summary-divider" />
                <div className="summary-row summary-total">
                  <span>Tổng cộng</span>
                  <span className="total-amount">{fmt(total)}</span>
                </div>
              </div>

              <motion.button
                className="checkout-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/checkout')}
              >
                Thanh toán ngay <FiArrowRight size={16} />
              </motion.button>

              <Link to="/products" className="continue-link">
                ← Tiếp tục mua sắm
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Cart;
