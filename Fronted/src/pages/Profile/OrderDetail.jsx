import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Container, Card, Row, Col, Badge, Spinner, Table, Button, Form, Alert } from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { clearCart, fetchCart } from '../../store/slices/cartSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const STATUS_LABEL_VI = {
  Pending: 'Chờ xử lý',
  AwaitingPayment: 'Chờ thanh toán VNPay',
  Confirmed: 'Đã xác nhận',
  Processing: 'Đang xử lý',
  Shipped: 'Đang giao',
  Delivered: 'Hoàn thành',
  Cancelled: 'Đã hủy',
};

const badgeVariant = (st) => {
  const s = String(st || '');
  if (s === 'Pending') return 'warning';
  if (s === 'AwaitingPayment') return 'warning';
  if (s === 'Cancelled') return 'danger';
  if (s === 'Delivered') return 'success';
  if (['Confirmed', 'Processing', 'Shipped'].includes(s)) return 'info';
  return 'secondary';
};

const fmtMoney = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const OrderDetail = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [payRetrying, setPayRetrying] = useState(false);
  const [paySwitching, setPaySwitching] = useState(false);
  const [reviewDraft, setReviewDraft] = useState({
    productId: null,
    rating: 5,
    comment: '',
  });

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Lỗi khi tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const paymentHandled = useRef(false);
  useEffect(() => {
    paymentHandled.current = false;
  }, [id]);

  useEffect(() => {
    if (paymentHandled.current) return;
    const pay = searchParams.get('payment');
    if (!pay) return;
    paymentHandled.current = true;
    if (pay === 'success') {
      toast.success('Thanh toán VNPay thành công! Đơn đang được xử lý.');
      void dispatch(clearCart());
      void dispatch(fetchCart());
      void dispatch(fetchNotifications());
    } else if (pay === 'failed') {
      const reason = searchParams.get('reason') || '';
      const code = searchParams.get('code') || '';
      let msg = 'Thanh toán chưa hoàn tất. Bạn có thể thanh toán lại hoặc đổi sang COD.';
      if (reason === 'amount') msg = 'Số tiền không khớp đơn. Liên hệ hỗ trợ nếu đã trừ tiền.';
      if (reason === 'signature') msg = 'Không xác thực được giao dịch. Thử thanh toán lại.';
      if (code && reason !== 'amount') msg = `${msg} (Mã: ${code})`;
      toast.error(msg);
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, dispatch]);

  const orderStatus = order?.orderStatus || order?.status || order?.statusName || '';
  const paySt = String(order?.paymentStatus || '').toLowerCase();
  const payMethod = String(order?.paymentMethod || '').toUpperCase();
  const needsVnpayAction =
    payMethod === 'VNPAY' &&
    paySt !== 'paid' &&
    (String(orderStatus).trim() === 'AwaitingPayment' ||
      String(orderStatus).trim() === 'Pending');
  const canCancel =
    String(orderStatus).trim() === 'Pending' ||
    String(orderStatus).trim() === 'AwaitingPayment';
  const isDelivered = useMemo(() => {
    const s = String(orderStatus).trim();
    return s === 'Delivered' || s === 'Completed';
  }, [orderStatus]);

  const reviewByProductId = order?.reviewByProductId || {};

  const handleCancel = async () => {
    if (!window.confirm('Hủy đơn hàng này? Chỉ áp dụng khi shop chưa xác nhận.')) return;
    try {
      setCancelling(true);
      await api.put(`/orders/${id}/cancel`);
      toast.success('Đã hủy đơn hàng');
      await fetchOrderDetail();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể hủy đơn');
    } finally {
      setCancelling(false);
    }
  };

  const handleRetryVnpay = async () => {
    try {
      setPayRetrying(true);
      const res = await api.put(`/orders/${id}/payment/vnpay`);
      const url = res.data?.data?.paymentUrl;
      if (url) {
        toast.info('Đang chuyển tới VNPay…');
        window.location.href = url;
      } else {
        toast.error('Không nhận được liên kết thanh toán');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể tạo liên kết VNPay');
    } finally {
      setPayRetrying(false);
    }
  };

  const handleSwitchCod = async () => {
    if (
      !window.confirm(
        'Chuyển sang thanh toán khi nhận hàng (COD)? Shop sẽ nhận đơn và xác nhận như đặt COD thường.',
      )
    ) {
      return;
    }
    try {
      setPaySwitching(true);
      await api.put(`/orders/${id}/payment/cod`);
      toast.success('Đã chuyển sang COD. Shop sẽ xác nhận đơn.');
      await fetchOrderDetail();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể đổi phương thức');
    } finally {
      setPaySwitching(false);
    }
  };

  const startReview = (pid) => {
    setReviewDraft({ productId: pid, rating: 5, comment: '' });
  };

  const submitReview = async () => {
    const { productId, rating, comment } = reviewDraft;
    if (!productId) return;
    try {
      setSubmitting(true);
      await api.post('/reviews', {
        productId,
        orderId: id,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success('Cảm ơn bạn đã đánh giá');
      setReviewDraft({ productId: null, rating: 5, comment: '' });
      await fetchOrderDetail();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Gửi đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const labelVi = STATUS_LABEL_VI[orderStatus] || orderStatus || '—';

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải...</p>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5 text-center">
        <h4>Không tìm thấy đơn hàng</h4>
        <Button variant="primary" onClick={() => navigate('/profile/orders')}>
          Quay lại danh sách
        </Button>
      </Container>
    );
  }

  const items = order.items ?? order.Items ?? [];

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h2 className="fw-bold mb-0">
          Chi tiết đơn #{order.orderCode ?? order.OrderCode ?? String(order._id).slice(-8)}
        </h2>
        <div className="d-flex gap-2">
          {canCancel && (
            <Button variant="outline-danger" size="sm" disabled={cancelling} onClick={handleCancel}>
              {cancelling ? 'Đang hủy…' : 'Hủy đơn'}
            </Button>
          )}
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/profile/orders')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>

      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="text-muted me-2">Trạng thái:</span>
              <Badge bg={badgeVariant(orderStatus)}>{labelVi}</Badge>
            </div>
            <small className="text-muted">
              Đặt lúc{' '}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString('vi-VN')
                : '—'}
            </small>
          </div>
          {isDelivered && (
            <p className="text-muted small mb-0 mt-2">
              Bạn có thể đánh giá từng sản phẩm trong bảng bên dưới.
            </p>
          )}
        </Card.Body>
      </Card>

      <Row>
        <Col md={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Sản phẩm</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Đơn giá</th>
                    <th>SL</th>
                    <th>Thành tiền</th>
                    <th style={{ minWidth: 200 }}>Đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const pidObj = item.productId;
                    const pid =
                      pidObj && typeof pidObj === 'object' && pidObj._id
                        ? String(pidObj._id)
                        : String(pidObj || '');
                    const name =
                      pidObj?.productName || item.productName || item.ProductName || 'Sản phẩm';
                    const price = Number(item.price ?? item.Price ?? 0);
                    const qty = Number(item.quantity ?? item.Quantity ?? 0);
                    const img =
                      resolveMediaUrl(pidObj?.images?.[0]) || '/placeholder.svg';
                    const reviewed = reviewByProductId[pid];
                    const open = reviewDraft.productId === pid;

                    return (
                      <tr key={pid || index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={img}
                              alt=""
                              style={{ width: 48, height: 48, objectFit: 'cover' }}
                              className="rounded me-2"
                            />
                            <span className="fw-bold">{name}</span>
                          </div>
                        </td>
                        <td>{fmtMoney(price)}</td>
                        <td>{qty}</td>
                        <td className="fw-bold">{fmtMoney(price * qty)}</td>
                        <td>
                          {!isDelivered && (
                            <span className="text-muted small">—</span>
                          )}
                          {isDelivered && reviewed && (
                            <span className="text-success small">
                              Đã đánh giá {reviewed.rating}★
                            </span>
                          )}
                          {isDelivered && !reviewed && !open && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => startReview(pid)}
                            >
                              Đánh giá
                            </Button>
                          )}
                          {isDelivered && !reviewed && open && (
                            <div className="mt-1">
                              <Form.Select
                                size="sm"
                                className="mb-2"
                                value={reviewDraft.rating}
                                onChange={(e) =>
                                  setReviewDraft((d) => ({
                                    ...d,
                                    rating: Number(e.target.value),
                                  }))
                                }
                              >
                                {[5, 4, 3, 2, 1].map((r) => (
                                  <option key={r} value={r}>
                                    {r} sao
                                  </option>
                                ))}
                              </Form.Select>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                size="sm"
                                placeholder="Nhận xét (tuỳ chọn)"
                                className="mb-2"
                                value={reviewDraft.comment}
                                onChange={(e) =>
                                  setReviewDraft((d) => ({ ...d, comment: e.target.value }))
                                }
                              />
                              <div className="d-flex gap-1">
                                <Button
                                  size="sm"
                                  disabled={submitting}
                                  onClick={submitReview}
                                >
                                  Gửi
                                </Button>
                                <Button
                                  size="sm"
                                  variant="light"
                                  onClick={() =>
                                    setReviewDraft({ productId: null, rating: 5, comment: '' })
                                  }
                                >
                                  Huỷ
                                </Button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {needsVnpayAction && (
            <Alert variant="warning" className="border-0 shadow-sm mb-3">
              <div className="fw-semibold mb-2">Chưa thanh toán VNPay</div>
              <p className="small mb-3">
                Nếu giao dịch lỗi hoặc tài khoản không đủ tiền, bạn có thể thanh toán lại hoặc đổi
                sang thanh toán khi nhận hàng (COD). Shop chỉ xử lý đơn sau khi thanh toán VNPay
                thành công hoặc sau khi bạn chọn COD.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={payRetrying}
                  onClick={handleRetryVnpay}
                >
                  {payRetrying ? 'Đang chuyển…' : 'Thanh toán lại VNPay'}
                </Button>
                <Button
                  variant="outline-dark"
                  size="sm"
                  disabled={paySwitching}
                  onClick={handleSwitchCod}
                >
                  {paySwitching ? 'Đang xử lý…' : 'Đổi sang COD'}
                </Button>
              </div>
            </Alert>
          )}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Thanh toán & giao hàng</h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-1">
                <span className="text-muted">Phương thức:</span>{' '}
                <strong>{order.paymentMethod ?? order.PaymentMethod ?? '—'}</strong>
              </p>
              <p className="mb-1">
                <span className="text-muted">Thanh toán:</span>{' '}
                <strong>{order.paymentStatus ?? '—'}</strong>
              </p>
              <hr />
              <p className="mb-1 text-muted small">Địa chỉ / ghi chú</p>
              <p className="mb-0 small">{order.shippingAddress ?? order.ShippingAddress ?? '—'}</p>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Tổng cộng</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between">
                <span className="fw-bold">Tổng đơn</span>
                <span className="fw-bold text-primary" style={{ fontSize: '1.25rem' }}>
                  {fmtMoney(order.totalAmount ?? order.TotalAmount)}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetail;
