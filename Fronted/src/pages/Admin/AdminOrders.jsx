import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Table, Button, Badge, Form, Row, Col, Spinner, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const orderStatus = (o) => o.status ?? o.statusName ?? o.Status ?? '';

const AdminOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ search: '', startDate: '', endDate: '' });
  const [pagination, setPagination] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const filters = useMemo(
    () => ({
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1),
      limit: 20,
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || ''
    }),
    [searchParams]
  );

  useEffect(() => {
    setDraft({
      search: filters.search,
      startDate: filters.startDate,
      endDate: filters.endDate
    });
  }, [filters.search, filters.startDate, filters.endDate]);

  const statusOptions = [
    'Chờ xử lý',
    'Đã xác nhận',
    'Đang giao',
    'Hoàn thành',
    'Đã hủy'
  ];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.orders.getAllOrders(filters);
      const payload = response.data?.data;
      setOrders(Array.isArray(payload?.orders) ? payload.orders : []);
      setPagination(payload?.pagination ?? null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const patchParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null || v === undefined) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    patchParams({
      search: draft.search.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      page: ''
    });
  };

  const handleStatusFilterChange = (e) => {
    const v = e.target.value;
    patchParams({ status: v, page: '' });
  };

  const handlePage = (page) => {
    patchParams({ page: page > 1 ? page : '' });
  };

  const handleStatusChange = (order) => {
    setSelectedOrder(order);
    setNewStatus(orderStatus(order));
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await adminService.orders.updateOrderStatus(selectedOrder.orderId || selectedOrder.OrderID, newStatus);
      toast.success('Cập nhật trạng thái thành công');
      setShowStatusModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

    const reason = prompt('Nhập lý do hủy:');
    if (!reason) return;

    try {
      await adminService.orders.cancelOrder(orderId, reason);
      toast.success('Hủy đơn hàng thành công');
      fetchOrders();
    } catch (error) {
      console.error('Error canceling order:', error);
      toast.error('Lỗi khi hủy đơn hàng');
    }
  };

  const openDetail = async (order) => {
    const id = order.orderId || order.OrderID;
    setDetail(null);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await adminService.orders.getOrderById(id);
      setDetail(res.data?.data ?? null);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được chi tiết đơn');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Chờ xử lý': 'warning',
      'Đã xác nhận': 'info',
      'Đang giao': 'primary',
      'Hoàn thành': 'success',
      'Đã hủy': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Đơn hàng</h1>
          <div className="admin-page-subtitle">
            Tìm kiếm, lọc (URL có thể chia sẻ: <code>?status=…</code>) và cập nhật trạng thái.
          </div>
        </div>
      </div>

      <Card className="admin-panel">
        <Card.Body className="admin-panel-body">
          <Form onSubmit={handleSearch}>
            <Row className="g-2">
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm (mã đơn, tên khách hàng, email...)"
                  value={draft.search}
                  onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
                />
              </Col>
              <Col md={3}>
                <Form.Select value={filters.status} onChange={handleStatusFilterChange}>
                  <option value="">Tất cả trạng thái</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Control
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="date"
                  value={draft.endDate}
                  onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                />
              </Col>
              <Col md={1}>
                <Button type="submit" variant="primary" className="w-100">
                  Lọc
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="admin-panel" style={{ padding: 24, textAlign: 'center' }}>
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          <Card className="admin-panel">
            <Card.Body className="admin-panel-body">
              <Table responsive hover className="admin-table table-hover">
                <thead>
                  <tr>
                    <th>Mã ĐH</th>
                    <th>Khách hàng</th>
                    <th>Ngày đặt</th>
                    <th>Số lượng</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order) => {
                      const st = orderStatus(order);
                      return (
                        <tr key={order.orderId || order.OrderID}>
                          <td className="fw-bold">{order.orderCode || order.OrderCode}</td>
                          <td>
                            <div>{order.customerName || order.CustomerName}</div>
                            <small className="text-muted">{order.customerEmail || order.CustomerEmail}</small>
                          </td>
                          <td>{new Date(order.orderDate || order.OrderDate).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <Badge bg="secondary">{order.itemCount ?? order.ItemCount ?? 0} sản phẩm</Badge>
                          </td>
                          <td className="fw-bold">{fmtMoney(order.totalAmount ?? order.TotalAmount)}</td>
                          <td>{getStatusBadge(st)}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              className="me-2"
                              onClick={() => openDetail(order)}
                            >
                              Chi tiết
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="me-2"
                              onClick={() => handleStatusChange(order)}
                              disabled={st === 'Hoàn thành' || st === 'Đã hủy'}
                            >
                              Cập nhật
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleCancelOrder(order.orderId || order.OrderID)}
                              disabled={st === 'Hoàn thành' || st === 'Đã hủy'}
                            >
                              Hủy
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">
                        Không có đơn hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-primary"
                disabled={filters.page === 1}
                onClick={() => handlePage(filters.page - 1)}
              >
                Trước
              </Button>
              <span className="mx-3 align-self-center">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline-primary"
                disabled={filters.page === pagination.totalPages}
                onClick={() => handlePage(filters.page + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}

      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cập nhật trạng thái</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Chọn trạng thái mới</Form.Label>
            <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Đóng
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus}>
            Cập nhật
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={detailOpen} onHide={() => setDetailOpen(false)} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : detail ? (
            <>
              <p>
                <strong>Mã:</strong> {detail.orderCode}{' '}
                {getStatusBadge(detail.statusName)}
              </p>
              <p>
                <strong>Ngày đặt:</strong>{' '}
                {detail.orderDate ? new Date(detail.orderDate).toLocaleString('vi-VN') : '—'}
              </p>
              <p>
                <strong>Giao hàng:</strong> {detail.shippingMethodName || '—'}
              </p>
              <p>
                <strong>Người nhận:</strong> {detail.receiverName || '—'} — {detail.receiverPhone || '—'}
              </p>
              <p>
                <strong>Địa chỉ:</strong>{' '}
                {[detail.addressLine, detail.ward, detail.district, detail.city].filter(Boolean).join(', ') ||
                  '—'}
              </p>
              {(detail.voucherCode || detail.voucherName) && (
                <p>
                  <strong>Voucher:</strong> {detail.voucherCode} {detail.voucherName ? `(${detail.voucherName})` : ''}
                </p>
              )}
              <hr />
              <h6>Sản phẩm</h6>
              <Table size="sm" bordered responsive className="admin-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>SL</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((it) => (
                    <tr key={it.orderItemId || it._id}>
                      <td>
                        {it.productName}
                        <div className="small text-muted">
                          {it.sizeName} / {it.colorName}
                        </div>
                      </td>
                      <td>{it.quantity}</td>
                      <td>{fmtMoney(it.unitPrice)}</td>
                      <td>{fmtMoney(it.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <p className="mb-0">
                <strong>Tổng thanh toán:</strong> {fmtMoney(detail.totalAmount)}
              </p>
              {(detail.payments || []).length > 0 && (
                <div className="mt-2 small text-muted">
                  Thanh toán:{' '}
                  {(detail.payments || [])
                    .map((p) => `${p.paymentMethodName}: ${fmtMoney(p.amount)}`)
                    .join(' · ')}
                </div>
              )}
            </>
          ) : (
            <p>Không có dữ liệu.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminOrders;
