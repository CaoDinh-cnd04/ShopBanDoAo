import { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Form, Row, Col, Spinner, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const statusOptions = [
    'Chờ xác nhận',
    'Đã xác nhận',
    'Đang sử dụng',
    'Hoàn thành',
    'Đã hủy'
  ];

  useEffect(() => {
    fetchBookings();
  }, [filters.page, filters.status]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await adminService.bookings.getAllBookings(filters);
      setBookings(response.data.data.bookings);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Lỗi khi tải danh sách booking');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchBookings();
  };

  const handleStatusChange = (booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.Status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await adminService.bookings.updateBookingStatus(selectedBooking.BookingID, newStatus);
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

    const reason = prompt('Nhập lý do hủy:');
    if (!reason) return;

    try {
      await adminService.bookings.cancelBooking(bookingId, reason);
      toast.success('Hủy booking thành công');
      fetchBookings();
    } catch (error) {
      console.error('Error canceling booking:', error);
      toast.error('Lỗi khi hủy booking');
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

  return (
    <Container fluid className="admin-page-wrap">
      <h1 className="admin-page-title mb-3">
        <i className="bi bi-calendar-check-fill me-2"></i>
        Quản Lý Đặt Sân
      </h1>

      {/* Filters */}
      <Form onSubmit={handleSearch} className="mb-4">
        <Row>
          <Col md={4}>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm (mã booking, tên khách hàng, sân...)"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </Col>
          <Col md={3}>
            <Form.Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Control
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </Col>
          <Col md={2}>
            <Form.Control
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </Col>
          <Col md={1}>
            <Button type="submit" variant="primary" className="w-100">
              <i className="bi bi-search"></i>
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Bookings Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          <Table responsive hover className="bg-white shadow-sm">
            <thead className="table-light">
              <tr>
                <th>Mã Booking</th>
                <th>Khách hàng</th>
                <th>Sân</th>
                <th>Ngày đặt</th>
                <th>Số khung giờ</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking.BookingID}>
                    <td className="fw-bold">{booking.BookingCode}</td>
                    <td>
                      <div>{booking.CustomerName}</div>
                      <small className="text-muted">{booking.CustomerEmail}</small>
                    </td>
                    <td>
                      <div>{booking.CourtName}</div>
                      <small className="text-muted">{booking.CourtType}</small>
                    </td>
                    <td>{new Date(booking.BookingDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <Badge bg="secondary">{booking.TimeSlotCount} khung giờ</Badge>
                    </td>
                    <td className="fw-bold">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(booking.TotalAmount)}
                    </td>
                    <td>{getStatusBadge(booking.Status)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                        onClick={() => handleStatusChange(booking)}
                        disabled={booking.Status === 'Hoàn thành' || booking.Status === 'Đã hủy'}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleCancelBooking(booking.BookingID)}
                        disabled={booking.Status === 'Hoàn thành' || booking.Status === 'Đã hủy'}
                      >
                        <i className="bi bi-x-circle"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    Không có booking nào
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-primary"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                <i className="bi bi-chevron-left"></i> Trước
              </Button>
              <span className="mx-3 align-self-center">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline-primary"
                disabled={filters.page === pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Sau <i className="bi bi-chevron-right"></i>
              </Button>
            </div>
          )}
        </>
      )}

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cập Nhật Trạng Thái</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Chọn trạng thái mới</Form.Label>
            <Form.Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus}>
            Cập nhật
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminBookings;
