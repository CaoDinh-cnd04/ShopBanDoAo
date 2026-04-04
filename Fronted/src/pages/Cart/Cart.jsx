import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowRight, FiTag } from 'react-icons/fi';
import { fetchCart, updateCartItem, removeFromCart, clearCart } from '../../store/slices/cartSlice';
import { selectCartWithPromo } from '../../store/slices/promotionSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import api from '../../services/api';
import './Cart.css';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const Cart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.cart);
  const items = useSelector(selectCartWithPromo);
  const subtotal = items.reduce((s, i) => s + (i.finalPrice ?? i.price) * i.quantity, 0);
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
      toast.info(t('cart.toastRemovedItem'));
    } else {
      dispatch(updateCartItem({ productId, quantity: qty, variantId }));
    }
  };

  const handleRemove = (productId, variantId) => {
    dispatch(removeFromCart({ productId, variantId }));
    toast.success(t('cart.toastRemovedCart'));
  };

  const safeItems = Array.isArray(items) ? items : [];
  const shipping = subtotal > 500000 ? 0 : 30000;
  const rawDiscount = appliedVoucher?.discountAmount != null ? Number(appliedVoucher.discountAmount) : 0;
  const discount = Math.min(Math.max(0, rawDiscount), subtotal || 0);
  const total = Math.max(0, (subtotal || 0) - discount + shipping);

  const handleApplyVoucher = async () => {
    const code = voucherInput.trim();
    if (!code) {
      toast.warn(t('cart.toastEnterVoucher'));
      return;
    }
    if (!isAuthenticated) {
      toast.warn(t('cart.toastLoginVoucher'));
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
      const raw = e.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : raw || 'Không áp dụng được mã';
      toast.error(msg);
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
          <h2>{t('cart.emptyTitle')}</h2>
          <p>{t('cart.emptyDesc')}</p>
          <button className="auth-submit-btn" style={{ width: 'auto', paddingInline: '2rem' }} onClick={() => navigate('/products')}>
            <FiShoppingBag size={18} /> {t('cart.continueBtn')}
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
          <h1 className="cart-title">{t('cart.titleWithCount', { count: safeItems.length })}</h1>
          <button className="cart-clear-btn" onClick={() => { dispatch(clearCart()); toast.success(t('cart.toastClearCart')); }}>
            {t('cart.clearAll')}
          </button>
        </div>

        <Row className="g-4">
          {/* Items */}
          <Col lg={8}>
            <div className="cart-items-card">
              <AnimatePresence>
                {safeItems.map((item) => {
                  const pid = item.productId;
                  const img = resolveMediaUrl(item.image) || '/placeholder.svg';
                  const price = item.finalPrice ?? item.price ?? 0;
                  const origPrice = item.promoDiscount > 0 ? item.price : null;
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
                        <img src={img} alt={item.productName} onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                      </Link>

                      {/* Info */}
                      <div className="cart-item-info">
                        <Link to={`/products/${pid}`} className="cart-item-name">
                          {item.productName}
                        </Link>
                        {item.variantLabel && (
                          <div className="cart-item-variant">{item.variantLabel}</div>
                        )}
                        <div className="cart-item-price-mobile">
                          {origPrice && <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.78rem', marginRight: 4 }}>{fmt(origPrice)}</span>}
                          <span style={origPrice ? { color: '#E00000', fontWeight: 700 } : {}}>{fmt(price)}</span>
                          {item.promoDiscount > 0 && <span style={{ marginLeft: 5, fontSize: '0.7rem', background: '#E00000', color: '#fff', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>-{item.promoDiscount}%</span>}
                        </div>
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
                      <div className="cart-item-subtotal">
                        {origPrice && <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.75rem' }}>{fmt(origPrice * item.quantity)}</div>}
                        <div style={origPrice ? { color: '#E00000', fontWeight: 700 } : {}}>{fmt(price * item.quantity)}</div>
                      </div>

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
              <h3 className="summary-title">{t('cart.summaryTitle')}</h3>

              {/* Voucher */}
              <div className="voucher-input-wrap">
                <FiTag size={15} className="voucher-icon" />
                <input
                  className="voucher-input"
                  placeholder={t('cart.voucherPlaceholder')}
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyVoucher())}
                  disabled={voucherLoading}
                />
                <button type="button" className="voucher-apply" onClick={handleApplyVoucher} disabled={voucherLoading}>
                  {voucherLoading ? '…' : t('cart.apply')}
                </button>
              </div>
              {appliedVoucher && (
                <div className="voucher-applied small text-success mb-2 d-flex justify-content-between align-items-center">
                  <span>
                    {t('cart.applied')} <strong>{appliedVoucher.code}</strong>
                    {appliedVoucher.name ? ` — ${appliedVoucher.name}` : ''} (−{fmt(discount)})
                  </span>
                  <button type="button" className="voucher-remove" onClick={clearVoucher}>
                    {t('cart.removeVoucher')}
                  </button>
                </div>
              )}

              <div className="summary-rows">
                <div className="summary-row">
                  <span>{t('cart.subtotal')}</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>{t('cart.shipping')}</span>
                  <span className={shipping === 0 ? 'text-success fw-bold' : ''}>{shipping === 0 ? t('cart.shippingFree') : fmt(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="summary-row text-success">
                    <span>{t('cart.discountLine')}</span>
                    <span>−{fmt(discount)}</span>
                  </div>
                )}
                {shipping === 0 && (
                  <p className="shipping-note">{t('cart.shippingNote')}</p>
                )}
                <hr className="summary-divider" />
                <div className="summary-row summary-total">
                  <span>{t('cart.total')}</span>
                  <span className="total-amount">{fmt(total)}</span>
                </div>
              </div>

              <motion.button
                className="checkout-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/checkout')}
              >
                {t('cart.checkoutNow')} <FiArrowRight size={16} />
              </motion.button>

              <Link to="/products" className="continue-link">
                {t('cart.continueShoppingLink')}
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Cart;
