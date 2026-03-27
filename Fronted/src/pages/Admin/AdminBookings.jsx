import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Table, Button, Badge, Form, Row, Col, Spinner, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const bookingStatus = (b) => b.statusName ?? b.Status ?? '';

const AdminBookings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ search: '', startDate: '', endDate: '' });
  const [pagination, setPagination] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
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
    'Chờ xác nhận',
    'Đã xác nhận',
    'Đang sử dụng',
    'Hoàn thành',
    'Đã hủy'
  ];

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.bookings.getAllBookings(filters);
      const payload = response.data?.data;
      setBookings(Array.isArray(payload?.bookings) ? payload.bookings : []);
      setPagination(payload?.pagination ?? null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Lỗi khi tải danh sách booking');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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
    patchParams({ status: e.target.value, page: '' });
  };

  const handlePage = (page) => {
    patchParams({ page: page > 1 ? page : '' });
  };

  const handleStatusChange = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(bookingStatus(booking));
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await adminService.bookings.updateBookingStatus(
        selectedBooking.bookingId ?? selectedBooking.BookingID,
        newStatus
      );
      toast.success('Cập nhật trạng thái thành công');
      setShowStatusModal(false);
      fetchBookings();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc muốn hủy booking này?')) return;

    try {
      await adminService.bookings.cancelBooking(bookingId, '');
      toast.success('Hủy booking thành công');
      fetchBookings();
    } catch (error) {
      console.error('Error canceling booking:', error);
      toast.error('Lỗi khi hủy booking');
    }
  };

  const openDetail = async (booking) => {
    const id = booking.bookingId ?? booking.BookingID;
    setDetail(null);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await adminService.bookings.getBookingById(id);
      setDetail(res.data?.data ?? null);
    } catch (e) {
      console.error(e);
      toast.error('Không tải được chi tiết đặt sân');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Chờ xác nhận': 'warning',
      'Đã xác nhận': 'info',
      'Đang sử dụng': 'primary',
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
          <h1 className="admin-page-title">Đặt sân</h1>
          <div className="admin-page-subtitle">
            Lọc theo trạng thái qua URL (<code>?status=…</code>), xem chi tiết khung giờ.
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
                  placeholder="Tìm kiếm (mã đặt, khách, sân...)"
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
                    <th>Mã Đặt</th>
                    <th>Khách hàng</th>
                    <th>Sân</th>
                    <th>Ngày đặt</th>
                    <th>Khung giờ</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length > 0 ? (
                    bookings.map((booking) => {
                      const st = bookingStatus(booking);
                      return (
                        <tr key={booking.bookingId ?? booking.BookingID}>
                          <td className="fw-bold">{booking.bookingCode ?? booking.BookingCode}</td>
                          <td>
                            <div>{booking.customerName ?? booking.CustomerName}</div>
                            <small className="text-muted">{booking.customerEmail ?? booking.CustomerEmail}</small>
                          </td>
                          <td>
                            <div>{booking.courtName ?? booking.CourtName}</div>
                            <small className="text-muted">{booking.courtType ?? booking.CourtType}</small>
                          </td>
                          <td>{new Date(booking.bookingDate ?? booking.BookingDate).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <Badge bg="secondary">
                              {booking.timeSlotCount ?? booking.TimeSlotCount ?? 0} khung giờ
                            </Badge>
                          </td>
                          <td className="fw-bold">{fmtMoney(booking.totalAmount ?? booking.TotalAmount)}</td>
                          <td>{getStatusBadge(st)}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              className="me-2"
                              onClick={() => openDetail(booking)}
                            >
                              Chi tiết
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              className="me-2"
                              onClick={() => handleStatusChange(booking)}
                              disabled={st === 'Hoàn thành' || st === 'Đã hủy'}
                            >
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleCancelBooking(booking.bookingId ?? booking.BookingID)}
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
                      <td colSpan="8" className="text-center text-muted">
                        Không có booking nào
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
          <Modal.Title>Chi tiết đặt sân</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : detail ? (
            <>
              <p>
                <strong>Mã:</strong> {detail.bookingCode} {getStatusBadge(detail.statusName)}
              </p>
              <p>
                <strong>Khách:</strong> {detail.customerName} — {detail.customerEmail}{' '}
                {detail.customerPhone ? `(${detail.customerPhone})` : ''}
              </p>
              <p>
                <strong>Sân:</strong> {detail.courtName} ({detail.courtTypeName || '—'})
              </p>
              <p>
                <strong>Địa điểm:</strong> {detail.location || '—'}
              </p>
              {detail.note && (
                <p>
                  <strong>Ghi chú:</strong> {detail.note}
                </p>
              )}
              <p>
                <strong>Ngày đặt:</strong>{' '}
                {detail.bookingDate ? new Date(detail.bookingDate).toLocaleString('vi-VN') : '—'}
              </p>
              <hr />
              <h6>Khung giờ</h6>
              <Table size="sm" bordered responsive className="admin-table">
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Giờ</th>
                    <th>Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.timeSlots || []).map((slot) => (
                    <tr key={slot.bookingDetailId || slot.slotName}>
                      <td>{slot.slotName || '—'}</td>
                      <td>
                        {slot.startTime ?? '—'} — {slot.endTime ?? '—'}
                      </td>
                      <td>{fmtMoney(slot.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <p className="mb-0">
                <strong>Tổng:</strong> {fmtMoney(detail.totalAmount)}
              </p>
              {(detail.payments || []).length > 0 && (
                <div className="mt-2 small text-muted">
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

export default AdminBookings;
