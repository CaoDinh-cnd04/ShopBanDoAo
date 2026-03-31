import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { FiCheck, FiMapPin, FiTruck, FiCreditCard, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { createOrder } from '../../store/slices/orderSlice';
import { clearCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import './Checkout.css';

const STEPS = [
  { id: 1, label: 'Địa chỉ', icon: FiMapPin },
  { id: 2, label: 'Vận chuyển', icon: FiTruck },
  { id: 3, label: 'Thanh toán', icon: FiCreditCard },
];

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, subtotal } = useSelector((s) => s.cart);
  const [step, setStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cartVoucher, setCartVoucher] = useState(null);

  const { register, handleSubmit, formState: { errors }, trigger } = useForm();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cartVoucher');
      if (raw) setCartVoucher(JSON.parse(raw));
    } catch {
      setCartVoucher(null);
    }
  }, []);

  const safeItems = Array.isArray(items) ? items : [];
  const shipping = shippingMethod === 'express' ? 60000 : (subtotal > 500000 ? 0 : 30000);
  const rawDisc = cartVoucher?.discountAmount != null ? Number(cartVoucher.discountAmount) : 0;
  const voucherDiscount = Math.min(Math.max(0, rawDisc), subtotal || 0);
  const total = Math.max(0, (subtotal || 0) - voucherDiscount + shipping);

  const nextStep = async () => {
    if (step === 1) {
      const ok = await trigger(['fullName', 'phone', 'address', 'city']);
      if (!ok) return;
    }
    if (step < 3) setStep(s => s + 1);
  };

  const onSubmit = async (data) => {
    try {
      const orderData = {
        shippingAddress: data,
        shippingMethod,
        paymentMethod,
        note: data.note,
      };
      const res = await dispatch(createOrder(orderData));
      if (createOrder.fulfilled.match(res)) {
        dispatch(clearCart());
        toast.success('Đặt hàng thành công! 🎉');
        navigate('/profile/orders');
      } else {
        toast.error(res.payload || 'Đặt hàng thất bại');
      }
    } catch {
      toast.error('Có lỗi xảy ra, thử lại sau');
    }
  };

  return (
    <div className="checkout-page">
      <Container>
        {/* Stepper */}
        <div className="checkout-stepper">
          {STEPS.map((s, i) => (
            <div key={s.id} className="stepper-item">
              <div className={`stepper-circle ${step > s.id ? 'done' : step === s.id ? 'active' : ''}`}>
                {step > s.id ? <FiCheck size={16} /> : <s.icon size={16} />}
              </div>
              <span className={`stepper-label ${step >= s.id ? 'active' : ''}`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className={`stepper-line ${step > s.id ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        <Row className="g-4">
          {/* Form area */}
          <Col lg={8}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {/* Step 1 — Address */}
                {step === 1 && (
                  <motion.div key="s1" className="checkout-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="checkout-card-title"><FiMapPin size={18} /> Địa chỉ giao hàng</h3>
                    <div className="co-grid">
                      <div className="co-field">
                        <label className="co-label">Họ và tên *</label>
                        <input className={`co-input ${errors.fullName ? 'error' : ''}`} placeholder="Nguyễn Văn A" {...register('fullName', { required: 'Bắt buộc' })} />
                        {errors.fullName && <span className="co-error">{errors.fullName.message}</span>}
                      </div>
                      <div className="co-field">
                        <label className="co-label">Số điện thoại *</label>
                        <input className={`co-input ${errors.phone ? 'error' : ''}`} placeholder="0912 345 678" {...register('phone', { required: 'Bắt buộc' })} />
                        {errors.phone && <span className="co-error">{errors.phone.message}</span>}
                      </div>
                      <div className="co-field co-full">
                        <label className="co-label">Địa chỉ *</label>
                        <input className={`co-input ${errors.address ? 'error' : ''}`} placeholder="123 Đường ABC, Phường XYZ" {...register('address', { required: 'Bắt buộc' })} />
                        {errors.address && <span className="co-error">{errors.address.message}</span>}
                      </div>
                      <div className="co-field">
                        <label className="co-label">Tỉnh / Thành phố *</label>
                        <input className={`co-input ${errors.city ? 'error' : ''}`} placeholder="Hồ Chí Minh" {...register('city', { required: 'Bắt buộc' })} />
                        {errors.city && <span className="co-error">{errors.city.message}</span>}
                      </div>
                      <div className="co-field">
                        <label className="co-label">Quận / Huyện</label>
                        <input className="co-input" placeholder="Quận 1" {...register('district')} />
                      </div>
                      <div className="co-field co-full">
                        <label className="co-label">Ghi chú</label>
                        <textarea className="co-input" rows={3} placeholder="Ghi chú cho người giao hàng..." {...register('note')} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2 — Shipping */}
                {step === 2 && (
                  <motion.div key="s2" className="checkout-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="checkout-card-title"><FiTruck size={18} /> Phương thức vận chuyển</h3>
                    <div className="co-options">
                      {[
                        { id: 'standard', label: 'Tiêu chuẩn', desc: '3–5 ngày', price: subtotal > 500000 ? 'Miễn phí' : fmt(30000) },
                        { id: 'express', label: 'Nhanh', desc: '1–2 ngày', price: fmt(60000) },
                      ].map(opt => (
                        <label key={opt.id} className={`co-option ${shippingMethod === opt.id ? 'active' : ''}`}>
                          <input type="radio" name="shipping" value={opt.id} checked={shippingMethod === opt.id} onChange={() => setShippingMethod(opt.id)} />
                          <FiTruck size={20} />
                          <div className="co-option-info">
                            <span className="co-option-title">{opt.label}</span>
                            <span className="co-option-desc">{opt.desc}</span>
                          </div>
                          <span className="co-option-price">{opt.price}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 3 — Payment */}
                {step === 3 && (
                  <motion.div key="s3" className="checkout-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="checkout-card-title"><FiCreditCard size={18} /> Phương thức thanh toán</h3>
                    <div className="co-options">
                      {[
                        { id: 'cod', label: 'Thanh toán khi nhận hàng', desc: 'Thanh toán tiền mặt' },
                        { id: 'banking', label: 'Chuyển khoản ngân hàng', desc: 'Thanh toán qua internet banking' },
                        { id: 'momo', label: 'Ví MoMo', desc: 'Thanh toán qua MoMo' },
                      ].map(opt => (
                        <label key={opt.id} className={`co-option ${paymentMethod === opt.id ? 'active' : ''}`}>
                          <input type="radio" name="payment" value={opt.id} checked={paymentMethod === opt.id} onChange={() => setPaymentMethod(opt.id)} />
                          <FiCreditCard size={20} />
                          <div className="co-option-info">
                            <span className="co-option-title">{opt.label}</span>
                            <span className="co-option-desc">{opt.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nav buttons */}
              <div className="checkout-nav">
                {step > 1 && (
                  <button type="button" className="co-btn-back" onClick={() => setStep(s => s - 1)}>
                    <FiArrowLeft size={16} /> Quay lại
                  </button>
                )}
                {step < 3 ? (
                  <button type="button" className="co-btn-next" onClick={nextStep}>
                    Tiếp theo <FiArrowRight size={16} />
                  </button>
                ) : (
                  <button type="submit" className="co-btn-next">
                    <FiCheck size={16} /> Đặt hàng
                  </button>
                )}
              </div>
            </form>
          </Col>

          {/* Order summary */}
          <Col lg={4}>
            <div className="co-summary-card">
              <h4 className="co-summary-title">Đơn hàng của bạn</h4>
              <div className="co-items">
                {safeItems.slice(0, 3).map((item) => (
                  <div key={item.id || item._id} className="co-item">
                    <img src={item.productImage || '/placeholder.jpg'} alt={item.productName} />
                    <div className="co-item-info">
                      <span className="co-item-name">{item.productName}</span>
                      <span className="co-item-qty">x{item.quantity}</span>
                    </div>
                    <span className="co-item-price">{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
                {safeItems.length > 3 && <p className="co-items-more">+{safeItems.length - 3} sản phẩm khác</p>}
              </div>
              <hr className="co-divider" />
              <div className="co-rows">
                <div className="co-row"><span>Tạm tính</span><span>{fmt(subtotal)}</span></div>
                {voucherDiscount > 0 && (
                  <div className="co-row" style={{ color: '#15803d' }}>
                    <span>Giảm giá ({cartVoucher?.code})</span>
                    <span>−{fmt(voucherDiscount)}</span>
                  </div>
                )}
                <div className="co-row"><span>Vận chuyển</span><span className={shipping === 0 ? 'co-free' : ''}>{shipping === 0 ? 'Miễn phí' : fmt(shipping)}</span></div>
                <hr className="co-divider" />
                <div className="co-row co-total"><span>Tổng cộng</span><span className="co-total-amount">{fmt(total)}</span></div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Checkout;
