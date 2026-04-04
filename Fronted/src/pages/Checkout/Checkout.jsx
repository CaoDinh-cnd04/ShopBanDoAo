import { useState, useEffect, useRef, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { FiCheck, FiMapPin, FiTruck, FiCreditCard, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { createOrder } from '../../store/slices/orderSlice';
import { clearCart, fetchCart } from '../../store/slices/cartSlice';
import { selectCartWithPromo } from '../../store/slices/promotionSlice';
import { fetchAddresses } from '../../store/slices/addressSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { toast } from 'react-toastify';
import './Checkout.css';

/** 2 bước: (1) địa chỉ — (2) vận chuyển + chọn COD/VNPay cùng màn hình */
const STEPS = [
  { id: 1, label: 'Thông tin nhận hàng', icon: FiMapPin },
  { id: 2, label: 'Giao hàng & thanh toán', icon: FiCreditCard },
];

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  useSelector((s) => s.cart);
  const items = useSelector(selectCartWithPromo); // items with finalPrice applied
  // Recalculate subtotal using discounted prices
  const subtotal = items.reduce((s, i) => s + (i.finalPrice ?? i.price) * i.quantity, 0);
  const { addresses: rawAddresses } = useSelector((s) => s.addresses);
  const savedAddresses = useMemo(
    () => (Array.isArray(rawAddresses) ? rawAddresses : []),
    [rawAddresses],
  );
  const [cartHydrated, setCartHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const setStepBoth = (s) => {
    stepRef.current = s;
    setStep(s);
  };
  const [shippingMethod, setShippingMethod] = useState('standard');
  /** null = chưa chọn — bắt buộc chọn COD hoặc VNPay trước khi đặt hàng / thanh toán */
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cartVoucher, setCartVoucher] = useState(null);
  const paymentFailHandled = useRef(false);
  /** Tránh race: Enter/submit kép có thể gọi placeOrder ngay sau khi vừa setStep(2) */
  const stepRef = useRef(1);
  const checkoutAddrInit = useRef(false);
  const [selectedSavedId, setSelectedSavedId] = useState('__manual');

  const { register, handleSubmit, formState: { errors }, trigger, reset, getValues } = useForm({
    shouldUnregister: false,
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
      ward: '',
      district: '',
      city: '',
      note: '',
    },
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cartVoucher');
      if (raw) setCartVoucher(JSON.parse(raw));
    } catch {
      setCartVoucher(null);
    }
  }, []);

  /** Quay về từ VNPay thất bại / hủy */
  useEffect(() => {
    if (paymentFailHandled.current) return;
    if (searchParams.get('payment') === 'failed') {
      paymentFailHandled.current = true;
      const reason = searchParams.get('reason') || '';
      const code = searchParams.get('code') || '';
      let msg = 'Thanh toán VNPay chưa hoàn tất hoặc đã hủy.';
      if (reason === 'amount') msg = 'Số tiền không khớp đơn hàng. Liên hệ hỗ trợ nếu đã trừ tiền.';
      if (reason === 'signature') msg = 'Không xác thực được giao dịch. Thử lại.';
      if (reason === 'order') msg = 'Không tìm thấy đơn hàng. Liên hệ hỗ trợ.';
      if (code && reason !== 'amount') msg = `${msg} (Mã: ${code})`;
      toast.error(msg);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  /** Tải giỏ từ server trước khi quyết định giỏ trống (tránh redirect nhầm khi F5 trang checkout). */
  useEffect(() => {
    if (!isAuthenticated) {
      setCartHydrated(true);
      return;
    }
    dispatch(fetchCart()).finally(() => setCartHydrated(true));
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(fetchAddresses());
  }, [dispatch, isAuthenticated]);

  /** Điền địa chỉ mặc định (hoặc đầu danh sách) một lần khi có địa chỉ đã lưu */
  useEffect(() => {
    if (!isAuthenticated || !savedAddresses.length || checkoutAddrInit.current) return;
    checkoutAddrInit.current = true;
    const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
    const id = String(def._id || def.id);
    setSelectedSavedId(id);
    reset({
      fullName: def.fullName || '',
      phone: def.phone || '',
      address: def.address || '',
      ward: def.ward || '',
      district: def.district || '',
      city: def.city || '',
      note: '',
    });
  }, [isAuthenticated, savedAddresses, reset]);

  const safeItems = Array.isArray(items) ? items : [];
  const shipping = shippingMethod === 'express' ? 60000 : (subtotal > 500000 ? 0 : 30000);

  useEffect(() => {
    if (!cartHydrated) return;
    if (safeItems.length === 0) {
      toast.info('Chưa có sản phẩm trong giỏ — quay lại giỏ hàng');
      navigate('/cart', { replace: true });
    }
  }, [cartHydrated, safeItems.length, navigate]);
  const rawDisc = cartVoucher?.discountAmount != null ? Number(cartVoucher.discountAmount) : 0;
  const voucherDiscount = Math.min(Math.max(0, rawDisc), subtotal || 0);
  const total = Math.max(0, (subtotal || 0) - voucherDiscount + shipping);

  const nextStep = async () => {
    if (stepRef.current !== 1) return;
    const ok = await trigger(['fullName', 'phone', 'address', 'ward', 'district', 'city']);
    if (!ok) return;
    stepRef.current = 2;
    setStep(2);
  };

  const placeOrder = async (data) => {
    try {
      if (paymentMethod !== 'cod' && paymentMethod !== 'vnpay') {
        toast.error('Vui lòng chọn phương thức thanh toán: COD hoặc VNPay.');
        return;
      }
      if (!safeItems.length) {
        toast.error('Giỏ hàng trống');
        return;
      }
      const items = safeItems
        .map((item) => {
          const productId = String(
            item.productId?._id ?? item.productId ?? '',
          ).trim();
          const variantRaw = item.variantId;
          const variantId = variantRaw
            ? String(variantRaw?._id ?? variantRaw).trim()
            : '';
          const row = {
            productId,
            quantity: Number(item.quantity) || 1,
            price: Number(item.finalPrice ?? item.price) || 0,
          };
          if (variantId) row.variantId = variantId;
          return row;
        })
        .filter((row) => row.productId);
      if (!items.length) {
        toast.error('Giỏ hàng thiếu mã sản phẩm — vui lòng quay lại giỏ hàng');
        return;
      }
      const pay = paymentMethod === 'vnpay' ? 'vnpay' : 'cod';
      const orderData = {
        items,
        totalAmount: total,
        paymentMethod: pay,
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          address: [data.address, data.ward].filter(Boolean).join(', ').trim(),
          district: data.district,
          city: data.city,
          note: data.note,
        },
        shippingMethod,
        note: data.note || '',
        ...(cartVoucher?.code ? { voucherCode: cartVoucher.code } : {}),
      };
      const res = await dispatch(createOrder(orderData));
      if (createOrder.rejected.match(res)) {
        toast.error(res.payload || 'Đặt hàng thất bại');
        return;
      }
      const payload = res.payload;
      if (paymentMethod === 'vnpay') {
        const url = payload?.paymentUrl;
        if (!url) {
          toast.error(
            'Không nhận được liên kết VNPay (kiểm tra cấu hình server). Chọn COD hoặc thử lại.',
          );
          return;
        }
        /** Không xóa giỏ ở đây — nếu VNPay lỗi/hủy, user vẫn có giỏ để thử lại; giỏ xóa khi thanh toán thành công (trang đơn) hoặc COD thành công */
        dispatch(fetchNotifications());
        toast.info('Đang chuyển tới cổng thanh toán VNPay…');
        window.location.href = url;
        return;
      }
      if (createOrder.fulfilled.match(res)) {
        await dispatch(clearCart());
        dispatch(fetchNotifications());
        toast.success('Đặt hàng thành công — thanh toán khi nhận hàng (COD).');
        navigate('/profile/orders', { replace: true });
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
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                /** Không bọc handleSubmit(placeOrder) khi đang ở bước 1 — tránh RHF gọi callback 2 lần → đặt hàng COD nhầm */
                if (stepRef.current !== 2) {
                  void nextStep();
                  return;
                }
                handleSubmit(placeOrder)(e);
              }}
            >
              <AnimatePresence mode="wait">
                {/* Step 1 — Address */}
                {step === 1 && (
                  <motion.div key="s1" className="checkout-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="checkout-card-title"><FiMapPin size={18} /> Thông tin nhận hàng</h3>
                    <p className="checkout-card-hint">Điền đầy đủ để shop giao đúng địa chỉ.</p>
                    {isAuthenticated && savedAddresses.length > 0 && (
                      <div className="co-field co-full">
                        <label className="co-label">Địa chỉ đã lưu</label>
                        <select
                          className="co-input"
                          value={selectedSavedId}
                          onChange={(e) => {
                            const v = e.target.value;
                            setSelectedSavedId(v);
                            const note = getValues('note') || '';
                            if (v === '__manual') {
                              reset({
                                fullName: '',
                                phone: '',
                                address: '',
                                ward: '',
                                district: '',
                                city: '',
                                note,
                              });
                              return;
                            }
                            const a = savedAddresses.find((x) => String(x._id || x.id) === v);
                            if (a) {
                              reset({
                                fullName: a.fullName || '',
                                phone: a.phone || '',
                                address: a.address || '',
                                ward: a.ward || '',
                                district: a.district || '',
                                city: a.city || '',
                                note,
                              });
                            }
                          }}
                        >
                          <option value="__manual">Nhập địa chỉ mới</option>
                          {savedAddresses.map((a) => {
                            const id = String(a._id || a.id);
                            return (
                              <option key={id} value={id}>
                                {(a.isDefault ? '★ Mặc định — ' : '')}{a.fullName} — {a.city}
                              </option>
                            );
                          })}
                        </select>
                        <p className="checkout-card-hint co-saved-hint">
                          Chọn địa chỉ đã lưu — mặc định được điền sẵn — hoặc nhập mới.
                        </p>
                      </div>
                    )}
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
                        <label className="co-label">Địa chỉ (số nhà, đường) *</label>
                        <input className={`co-input ${errors.address ? 'error' : ''}`} placeholder="123 Đường ABC" {...register('address', { required: 'Bắt buộc' })} />
                        {errors.address && <span className="co-error">{errors.address.message}</span>}
                      </div>
                      <div className="co-field">
                        <label className="co-label">Phường / Xã *</label>
                        <input className={`co-input ${errors.ward ? 'error' : ''}`} placeholder="Phường Bến Nghé" {...register('ward', { required: 'Bắt buộc' })} />
                        {errors.ward && <span className="co-error">{errors.ward.message}</span>}
                      </div>
                      <div className="co-field">
                        <label className="co-label">Quận / Huyện *</label>
                        <input className={`co-input ${errors.district ? 'error' : ''}`} placeholder="Quận 1" {...register('district', { required: 'Bắt buộc' })} />
                        {errors.district && <span className="co-error">{errors.district.message}</span>}
                      </div>
                      <div className="co-field">
                        <label className="co-label">Tỉnh / Thành phố *</label>
                        <input className={`co-input ${errors.city ? 'error' : ''}`} placeholder="Hồ Chí Minh" {...register('city', { required: 'Bắt buộc' })} />
                        {errors.city && <span className="co-error">{errors.city.message}</span>}
                      </div>
                      <div className="co-field co-full">
                        <label className="co-label">Ghi chú</label>
                        <textarea className="co-input" rows={3} placeholder="Ghi chú cho người giao hàng..." {...register('note')} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2 — Vận chuyển + phương thức thanh toán (cùng màn hình) */}
                {step === 2 && (
                  <motion.div key="s2" className="checkout-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="checkout-card-title"><FiTruck size={18} /> Giao hàng</h3>
                    <p className="checkout-card-hint">Chọn tốc độ giao — phí hiển thị bên phải.</p>
                    <div className="co-options co-mb">
                      {[
                        { id: 'standard', label: 'Tiêu chuẩn', desc: '3–5 ngày', price: subtotal > 500000 ? 'Miễn phí' : fmt(30000) },
                        { id: 'express', label: 'Nhanh', desc: '1–2 ngày', price: fmt(60000) },
                      ].map((opt) => (
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

                    <h3 className="checkout-card-title co-title-pay"><FiCreditCard size={18} /> Phương thức thanh toán</h3>
                    <p className="checkout-card-hint">
                      Bấm chọn một trong hai — <strong>COD</strong> (trả khi nhận) hoặc <strong>VNPay</strong> (thanh toán online). Không có mặc định; phải chọn rồi mới đặt hàng / sang cổng VNPay.
                    </p>
                    <div className="co-options co-options--pay" role="group" aria-label="Phương thức thanh toán">
                      {[
                        {
                          id: 'cod',
                          label: 'Thanh toán khi nhận hàng (COD)',
                          badge: 'Tiền mặt',
                          desc: 'Trả tiền mặt khi shipper giao hàng tận nơi',
                        },
                        {
                          id: 'vnpay',
                          label: 'VNPay',
                          badge: 'Online',
                          desc: 'QR, thẻ ATM, thẻ quốc tế — chuyển sang cổng VNPay',
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`co-option co-option--choice ${paymentMethod === opt.id ? 'active' : ''}`}
                          onClick={() => setPaymentMethod(opt.id)}
                          aria-pressed={paymentMethod === opt.id}
                        >
                          <FiCreditCard size={20} className="co-option-icon" />
                          <div className="co-option-info">
                            <span className="co-option-title-row">
                              <span className="co-option-title">{opt.label}</span>
                              <span className="co-option-badge">{opt.badge}</span>
                            </span>
                            <span className="co-option-desc">{opt.desc}</span>
                          </div>
                          <span className="co-option-check" aria-hidden>
                            {paymentMethod === opt.id ? '✓' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nav buttons */}
              <div className="checkout-nav">
                {step > 1 && (
                  <button
                    type="button"
                    className="co-btn-back"
                    onClick={() => setStepBoth(1)}
                  >
                    <FiArrowLeft size={16} /> Quay lại
                  </button>
                )}
                {step < 2 ? (
                  <button type="button" className="co-btn-next" onClick={nextStep}>
                    Tiếp theo <FiArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="co-btn-next"
                    disabled={paymentMethod !== 'cod' && paymentMethod !== 'vnpay'}
                    title={
                      paymentMethod == null
                        ? 'Chọn COD hoặc VNPay ở trên'
                        : undefined
                    }
                  >
                    <FiCheck size={16} />{' '}
                    {paymentMethod == null && 'Chọn phương thức thanh toán'}
                    {paymentMethod === 'vnpay' && 'Thanh toán VNPay'}
                    {paymentMethod === 'cod' && 'Đặt hàng (COD — trả khi nhận)'}
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
                  <div
                    key={`${item.productId}-${item.variantId || ''}`}
                    className="co-item"
                  >
                    <img src={item.image || item.productImage || '/placeholder.svg'} alt={item.productName} />
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
                {step === 2 && (
                  <div className="co-pay-summary">
                    <span className="co-pay-summary-label">Thanh toán</span>
                    <span className="co-pay-summary-value">
                      {paymentMethod === 'vnpay'
                        ? 'VNPay (online)'
                        : paymentMethod === 'cod'
                          ? 'COD (khi nhận hàng)'
                          : 'Chưa chọn'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Checkout;
