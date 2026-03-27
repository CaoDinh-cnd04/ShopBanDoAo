import { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight, FiTag } from 'react-icons/fi';
import { fetchCart, updateCartItem, removeFromCart, clearCart, addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';
import './Cart.css';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, subtotal, isLoading } = useSelector((s) => s.cart);
  const { isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  const updateQty = (productId, qty) => {
    if (qty <= 0) { dispatch(removeFromCart(productId)); toast.info('Đã xoá sản phẩm'); }
    else dispatch(updateCartItem({ productId, quantity: qty }));
  };

  const handleRemove = (productId) => { dispatch(removeFromCart(productId)); toast.success('Đã xoá khỏi giỏ'); };

  const safeItems = Array.isArray(items) ? items : [];
  const shipping = subtotal > 500000 ? 0 : 30000;
  const total = (subtotal || 0) + shipping;

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
                  const img = item.image || '/placeholder.jpg';
                  const price = item.price || 0;
                  return (
                    <motion.div
                      key={pid}
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
                        <div className="cart-item-price-mobile">{fmt(price)}</div>
                      </div>

                      {/* Quantity */}
                      <div className="cart-qty-ctrl">
                        <button className="qty-btn" onClick={() => updateQty(pid, item.quantity - 1)}>
                          <FiMinus size={14} />
                        </button>
                        <span className="qty-num">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQty(pid, item.quantity + 1)}>
                          <FiPlus size={14} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="cart-item-subtotal">{fmt(price * item.quantity)}</div>

                      {/* Remove */}
                      <motion.button
                        className="cart-remove-btn"
                        onClick={() => handleRemove(pid)}
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
                <input className="voucher-input" placeholder="Mã giảm giá..." />
                <button className="voucher-apply">Áp dụng</button>
              </div>

              <div className="summary-rows">
                <div className="summary-row">
                  <span>Tạm tính</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Vận chuyển</span>
                  <span className={shipping === 0 ? 'text-success fw-bold' : ''}>{shipping === 0 ? 'Miễn phí 🎉' : fmt(shipping)}</span>
                </div>
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
