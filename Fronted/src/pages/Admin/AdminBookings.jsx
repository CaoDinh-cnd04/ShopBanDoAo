import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Table, Button, Badge, Form, Row, Col, Spinner, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const bookingId = (b) => b?._id?.toString?.() || b?.bookingId || b?.BookingID;

const bookingStatus = (b) =>
  b.bookingStatus ?? b.statusName ?? b.Status ?? '';

/** Giá trị API (Mongo) — đồng bộ schema Booking.bookingStatus */
const BOOKING_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Chờ xác nhận' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'InUse', label: 'Đang sử dụng' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

const statusLabelVi = (apiValue) =>
  BOOKING_STATUS_OPTIONS.find((o) => o.value === apiValue)?.label || apiValue || '—';

const isTerminalBookingStatus = (st) => {
  const s = String(st || '').trim();
  if (!s) return false;
  const terminal = new Set([
    'Completed',
    'Cancelled',
    'Canceled',
    'Hoàn thành',
    'Đã hủy',
  ]);
  return terminal.has(s);
};

/** Không chọn Hoàn thành trực tiếp — dùng hết giờ tự động hoặc Hoàn thành sớm + lý do */
const BOOKING_STATUS_OPTIONS_ADMIN = BOOKING_STATUS_OPTIONS.filter((o) => o.value !== 'Completed');

const canCompleteEarlyBooking = (b) => {
  const st = String(bookingStatus(b) || '').trim().toLowerCase();
  const pay = String(b.paymentStatus || '').trim().toLowerCase();
  return st === 'confirmed' && pay === 'depositpaid';
};

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
  const [showEarlyModal, setShowEarlyModal] = useState(false);
  const [earlyTarget, setEarlyTarget] = useState(null);
  const [earlyReason, setEarlyReason] = useState('');

  const filters = useMemo(
    () => ({
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1),
      limit: 20,
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
    }),
    [searchParams],
  );

  useEffect(() => {
    setDraft({
      search: filters.search,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
  }, [filters.search, filters.startDate, filters.endDate]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
        ...(filters.status?.trim() ? { status: filters.status.trim() } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
      };
      const response = await adminService.bookings.getAllBookings(params);
      const payload = response.data?.data;
      setBookings(Array.isArray(payload?.bookings) ? payload.bookings : []);
      setPagination(payload?.pagination ?? null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Lỗi khi tải danh sách booking',
      );
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
      page: '',
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

  const handleCompleteEarly = async () => {
    const id = bookingId(earlyTarget);
    const reason = earlyReason.trim();
    if (reason.length < 5) {
      toast.error('Nhập lý do hoàn thành sớm (ít nhất 5 ký tự).');
      return;
    }
    try {
      await adminService.bookings.completeBookingEarly(id, { reason });
      toast.success('Đã hoàn thành sớm — khung giờ đã mở cho đặt mới');
      setShowEarlyModal(false);
      setEarlyTarget(null);
      setEarlyReason('');
      fetchBookings();
      if (detail && bookingId(detail) === id) {
        const res = await adminService.bookings.getBookingById(id);
        setDetail(res.data?.data ?? null);
      }
    } catch (error) {
      console.error('Error complete early:', error);
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Không thể hoàn thành sớm',
      );
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await adminService.bookings.updateBookingStatus(bookingId(selectedBooking), newStatus);
      toast.success('Cập nhật trạng thái thành công');
      setShowStatusModal(false);
      fetchBookings();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Lỗi khi cập nhật trạng thái',
      );
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Hủy booking này? Trạng thái sẽ là Đã hủy (Cancelled).')) return;
    try {
      await adminService.bookings.cancelBooking(id);
      toast.success('Đã hủy booking');
      if (detail && bookingId(detail) === id) {
        setDetailOpen(false);
        setDetail(null);
      }
      fetchBookings();
    } catch (error) {
      console.error('Error canceling booking:', error);
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Lỗi khi hủy booking',
      );
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Xóa vĩnh viễn booking này khỏi hệ thống?')) return;
    try {
      await adminService.bookings.deleteBooking(id);
      toast.success('Đã xóa booking');
      if (detail && bookingId(detail) === id) {
        setDetailOpen(false);
        setDetail(null);
      }
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Lỗi khi xóa booking',
      );
    }
  };

  const openDetail = async (booking) => {
    const id = bookingId(booking);
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
    const s = String(status || '').trim();
    const label = statusLabelVi(s);
    const variants = {
      'Chờ xác nhận': 'warning',
      Pending: 'warning',
      'Đã xác nhận': 'info',
      Confirmed: 'info',
      'Đang sử dụng': 'primary',
      InUse: 'primary',
      'Hoàn thành': 'success',
      Completed: 'success',
      'Đã hủy': 'danger',
      Cancelled: 'danger',
      Canceled: 'danger',
    };
    const bg = variants[s] || variants[label] || 'secondary';
    return <Badge bg={bg}>{label}</Badge>;
  };

  const fmtMoney = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Đặt sân</h1>
          <div className="admin-page-subtitle">
            Lọc theo trạng thái hoặc ngày, xem chi tiết khung giờ — dữ liệu từ server.
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
                  {BOOKING_STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
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
                        <tr key={bookingId(booking)}>
                          <td className="fw-bold">
                            {booking.bookingCode ?? booking.BookingCode ?? bookingId(booking)}
                          </td>
                          <td>
                            <div>{(booking.customerName ?? booking.CustomerName) || '—'}</div>
                            <small className="text-muted d-block">
                              {(booking.customerEmail ?? booking.CustomerEmail) || ''}
                            </small>
                            {booking.customerPhone ? (
                              <small className="text-muted">{booking.customerPhone}</small>
                            ) : null}
                          </td>
                          <td>
                            <div>{booking.courtName ?? booking.CourtName ?? '—'}</div>
                            <small className="text-muted">{booking.courtType ?? booking.CourtType ?? ''}</small>
                          </td>
                          <td>
                            {(() => {
                              const d = booking.bookingDate ?? booking.BookingDate;
                              const t = d ? new Date(d) : null;
                              return t && !Number.isNaN(t.getTime())
                                ? t.toLocaleDateString('vi-VN')
                                : '—';
                            })()}
                          </td>
                          <td>
                            <Badge bg="secondary">
                              {booking.timeRange ||
                                `${booking.startTime ?? '—'} — ${booking.endTime ?? '—'}`}
                            </Badge>
                          </td>
                          <td className="fw-bold">{fmtMoney(booking.totalAmount ?? booking.TotalAmount)}</td>
                          <td>{getStatusBadge(st)}</td>
                          <td>
                            <div className="admin-actions">
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => openDetail(booking)}
                              >
                                Chi tiết
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => handleStatusChange(booking)}
                                disabled={isTerminalBookingStatus(st)}
                              >
                                Sửa
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleCancelBooking(bookingId(booking))}
                                disabled={isTerminalBookingStatus(st)}
                              >
                                Hủy
                              </Button>
                              {canCompleteEarlyBooking(booking) && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => {
                                    setEarlyTarget(booking);
                                    setEarlyReason('');
                                    setShowEarlyModal(true);
                                  }}
                                >
                                  Hoàn thành sớm
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeleteBooking(bookingId(booking))}
                              >
                                Xóa
                              </Button>
                            </div>
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
              {BOOKING_STATUS_OPTIONS_ADMIN.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Hoàn thành khi hết giờ sẽ tự cập nhật. Đóng ca sớm: dùng nút &quot;Hoàn thành sớm&quot; trên dòng lịch.
            </Form.Text>
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

      <Modal show={showEarlyModal} onHide={() => setShowEarlyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Hoàn thành sớm (mở khung giờ)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted">
            Ca chưa đến giờ kết thúc. Nhập lý do (ví dụ: khách về sớm, sân hỏng…) — hệ thống sẽ đánh dấu Hoàn thành và
            cho phép người khác đặt lại khung này.
          </p>
          <Form.Group>
            <Form.Label>Lý do *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={earlyReason}
              onChange={(e) => setEarlyReason(e.target.value)}
              placeholder="Tối thiểu 5 ký tự"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEarlyModal(false)}>
            Đóng
          </Button>
          <Button variant="success" onClick={handleCompleteEarly}>
            Xác nhận hoàn thành sớm
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
                <strong>Mã:</strong> {detail.bookingCode || bookingId(detail)}{' '}
                {getStatusBadge(detail.bookingStatus ?? detail.statusName)}
              </p>
              <p>
                <strong>Khách:</strong> {detail.customerName || '—'} — {detail.customerEmail || '—'}{' '}
                {detail.customerPhone ? `(${detail.customerPhone})` : ''}
              </p>
              <p>
                <strong>Sân:</strong> {detail.courtName || '—'} ({detail.courtTypeName || '—'})
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
              {detail.slotEndAt ? (
                <p>
                  <strong>Kết thúc ca (ước tính):</strong>{' '}
                  {new Date(detail.slotEndAt).toLocaleString('vi-VN')}
                </p>
              ) : null}
              {detail.completionSource === 'admin_early' && detail.earlyCompleteReason ? (
                <p>
                  <strong>Hoàn thành sớm — lý do:</strong> {detail.earlyCompleteReason}
                </p>
              ) : null}
              {detail.completionSource === 'auto' ? (
                <p className="small text-muted">Trạng thái hoàn thành được cập nhật tự động sau khi hết giờ đặt.</p>
              ) : null}
              {canCompleteEarlyBooking(detail) ? (
                <div className="mb-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => {
                      setEarlyTarget(detail);
                      setEarlyReason('');
                      setShowEarlyModal(true);
                    }}
                  >
                    Hoàn thành sớm (nhập lý do)
                  </Button>
                </div>
              ) : null}
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
                  {(detail.timeSlots || []).map((slot, i) => (
                    <tr key={String(slot.bookingDetailId || slot.slotName || i)}>
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
