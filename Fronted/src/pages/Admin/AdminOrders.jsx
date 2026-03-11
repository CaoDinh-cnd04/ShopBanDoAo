import { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Form, Row, Col, Spinner, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  const statusOptions = [
    'Chờ xử lý',
    'Đã xác nhận',
    'Đang giao',
    'Hoàn thành',
    'Đã hủy'
  ];

  useEffect(() => {
    fetchOrders();
  }, [filters.page, filters.status]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminService.orders.getAllOrders(filters);
      setOrders(response.data.data.orders);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchOrders();
  };

  const handleStatusChange = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.Status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await adminService.orders.updateOrderStatus(selectedOrder.OrderID, newStatus);
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

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Đơn hàng</h1>
          <div className="admin-page-subtitle">Tìm kiếm, lọc và cập nhật trạng thái đơn hàng.</div>
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
                  Lọc
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Orders Table */}
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
                orders.map((order) => (
                  <tr key={order.OrderID}>
                    <td className="fw-bold">{order.OrderCode}</td>
                    <td>
                      <div>{order.CustomerName}</div>
                      <small className="text-muted">{order.CustomerEmail}</small>
                    </td>
                    <td>{new Date(order.OrderDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <Badge bg="secondary">{order.ItemCount} sản phẩm</Badge>
                    </td>
                    <td className="fw-bold">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(order.TotalAmount)}
                    </td>
                    <td>{getStatusBadge(order.Status)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                        onClick={() => handleStatusChange(order)}
                        disabled={order.Status === 'Hoàn thành' || order.Status === 'Đã hủy'}
                      >
                        Cập nhật
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleCancelOrder(order.OrderID)}
                        disabled={order.Status === 'Hoàn thành' || order.Status === 'Đã hủy'}
                      >
                        Hủy
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center" style={{ color: 'rgba(255,255,255,0.62)' }}>
                    Không có đơn hàng nào
                  </td>
                </tr>
              )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-primary"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                Trước
              </Button>
              <span className="mx-3 align-self-center">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline-primary"
                disabled={filters.page === pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Sau
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
    </div>
  );
};

export default AdminOrders;
