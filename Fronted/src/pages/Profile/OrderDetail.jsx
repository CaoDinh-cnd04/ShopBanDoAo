import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Badge, Spinner, Table, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchOrderDetail = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get(`/orders/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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

    const getStatusTimeline = () => {
        const statuses = ['Chờ xử lý', 'Đã xác nhận', 'Đang giao', 'Hoàn thành'];
        const currentIndex = statuses.indexOf(order?.statusName || order?.Status);

        return statuses.map((status, index) => ({
            status,
            completed: index <= currentIndex,
            active: index === currentIndex
        }));
    };

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

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">
                    <i className="bi bi-receipt me-2"></i>
                    Chi Tiết Đơn Hàng #{order.orderCode ?? order.OrderCode}
                </h2>
                <Button variant="outline-secondary" onClick={() => navigate('/profile/orders')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Quay lại
                </Button>
            </div>

            {/* Status Timeline */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <h5 className="fw-bold mb-3">Trạng thái đơn hàng</h5>
                    <div className="d-flex justify-content-between position-relative">
                        {getStatusTimeline().map((item, index) => (
                            <div key={index} className="text-center" style={{ flex: 1 }}>
                                <div
                                    className={`rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center ${item.completed ? 'bg-success' : 'bg-secondary'
                                        }`}
                                    style={{ width: '40px', height: '40px' }}
                                >
                                    <i className={`bi bi-${item.completed ? 'check' : 'circle'} text-white`}></i>
                                </div>
                                <small className={item.active ? 'fw-bold' : ''}>{item.status}</small>
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>

            <Row>
                {/* Order Info */}
                <Col md={8}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Thông tin đơn hàng</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <p className="mb-1 text-muted">Mã đơn hàng:</p>
                                    <p className="fw-bold">{order.orderCode ?? order.OrderCode}</p>
                                </Col>
                                <Col md={6}>
                                    <p className="mb-1 text-muted">Ngày đặt:</p>
                                    <p className="fw-bold">
                                        {new Date(order.orderDate ?? order.OrderDate).toLocaleString('vi-VN')}
                                    </p>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <p className="mb-1 text-muted">Trạng thái:</p>
                                    {getStatusBadge(order.statusName ?? order.Status)}
                                </Col>
                                <Col md={6}>
                                    <p className="mb-1 text-muted">Phương thức thanh toán:</p>
                                    <p className="fw-bold">{order.paymentMethod ?? order.PaymentMethod}</p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Products */}
                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Sản phẩm</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th>Đơn giá</th>
                                        <th>Số lượng</th>
                                        <th>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(order.items ?? order.Items)?.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <img
                                                        src={(item.productImage ?? item.ProductImage) || '/placeholder.jpg'}
                                                        alt={item.productName ?? item.ProductName}
                                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                        className="rounded me-2"
                                                    />
                                                    <div>
                                                        <div className="fw-bold">{item.productName ?? item.ProductName}</div>
                                                        {(item.variantName ?? item.VariantName) && (
                                                            <small className="text-muted">{item.variantName ?? item.VariantName}</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {new Intl.NumberFormat('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND'
                                                }).format(item.price ?? item.Price ?? 0)}
                                            </td>
                                            <td>{item.quantity ?? item.Quantity ?? 0}</td>
                                            <td className="fw-bold">
                                                {new Intl.NumberFormat('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND'
                                                }).format((item.price ?? item.Price ?? 0) * (item.quantity ?? item.Quantity ?? 0))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Summary */}
                <Col md={4}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Địa chỉ giao hàng</h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="mb-1 fw-bold">{order.receiverName ?? order.ReceiverName}</p>
                            <p className="mb-1">
                                <i className="bi bi-telephone me-2"></i>
                                {order.receiverPhone ?? order.ReceiverPhone}
                            </p>
                            <p className="mb-0 text-muted">
                                <i className="bi bi-geo-alt me-2"></i>
                                {order.shippingAddress ?? order.ShippingAddress}
                            </p>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Tổng cộng</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Tạm tính:</span>
                                <span>
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    }).format(order.subTotal ?? order.SubTotal ?? order.totalAmount ?? order.TotalAmount ?? 0)}
                                </span>
                            </div>
                            {(order.shippingFee ?? order.ShippingFee ?? 0) > 0 && (
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Phí vận chuyển:</span>
                                    <span>
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(order.shippingFee ?? order.ShippingFee)}
                                    </span>
                                </div>
                            )}
                            {(order.discountAmount ?? order.DiscountAmount ?? 0) > 0 && (
                                <div className="d-flex justify-content-between mb-2 text-success">
                                    <span>Giảm giá:</span>
                                    <span>
                                        -{new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(order.discountAmount ?? order.DiscountAmount)}
                                    </span>
                                </div>
                            )}
                            <hr />
                            <div className="d-flex justify-content-between">
                                <span className="fw-bold">Tổng cộng:</span>
                                <span className="fw-bold text-primary" style={{ fontSize: '1.25rem' }}>
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    }).format(order.totalAmount ?? order.TotalAmount ?? 0)}
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
