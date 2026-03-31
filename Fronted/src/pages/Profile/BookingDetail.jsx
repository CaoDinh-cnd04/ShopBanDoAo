import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Badge, Spinner, Table, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const BookingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchBookingDetail = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get(`/bookings/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBooking(response.data.data);
        } catch (error) {
            console.error('Error fetching booking:', error);
            toast.error('Lỗi khi tải thông tin booking');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchBookingDetail();
    }, [fetchBookingDetail]);

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

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Đang tải...</p>
            </Container>
        );
    }

    if (!booking) {
        return (
            <Container className="py-5 text-center">
                <h4>Không tìm thấy booking</h4>
                <Button variant="primary" onClick={() => navigate('/profile/bookings')}>
                    Quay lại danh sách
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">
                    <i className="bi bi-calendar-check me-2"></i>
                    Chi Tiết Booking #{booking.bookingCode ?? booking.BookingCode}
                </h2>
                <Button variant="outline-secondary" onClick={() => navigate('/profile/bookings')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Quay lại
                </Button>
            </div>

            <Row>
                {/* Booking Info */}
                <Col md={8}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Thông tin đặt sân</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <p className="mb-1 text-muted">Mã booking:</p>
                                    <p className="fw-bold">{booking.bookingCode ?? booking.BookingCode}</p>
                                </Col>
                                <Col md={6}>
                                    <p className="mb-1 text-muted">Ngày đặt:</p>
                                    <p className="fw-bold">
                                        {new Date(booking.bookingDate ?? booking.BookingDate).toLocaleDateString('vi-VN')}
                                    </p>
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <p className="mb-1 text-muted">Trạng thái:</p>
                                    {getStatusBadge(booking.statusName ?? booking.Status)}
                                </Col>
                                <Col md={6}>
                                    <p className="mb-1 text-muted">Phương thức thanh toán:</p>
                                    <p className="fw-bold">{booking.paymentMethod ?? booking.PaymentMethod}</p>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Court Info */}
                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Thông tin sân</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                {booking.CourtImage && (
                                    <img
                                        src={booking.CourtImage}
                                        alt={booking.CourtName}
                                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                        className="rounded me-3"
                                    />
                                )}
                                <div>
                                    <h5 className="fw-bold mb-1">{booking.CourtName}</h5>
                                    <p className="text-muted mb-1">{booking.CourtType}</p>
                                    <p className="mb-0">
                                        <i className="bi bi-geo-alt me-2"></i>
                                        {booking.CourtLocation}
                                    </p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Time Slots */}
                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Khung giờ đã đặt</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Ngày</th>
                                        <th>Giờ bắt đầu</th>
                                        <th>Giờ kết thúc</th>
                                        <th>Giá</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(booking.timeSlots ?? booking.TimeSlots)?.map((slot, index) => (
                                        <tr key={index}>
                                            <td>{new Date(slot.date ?? slot.Date).toLocaleDateString('vi-VN')}</td>
                                            <td>{slot.startTime ?? slot.StartTime}</td>
                                            <td>{slot.endTime ?? slot.EndTime}</td>
                                            <td className="fw-bold">
                                                {new Intl.NumberFormat('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND'
                                                }).format(slot.price ?? slot.Price ?? 0)}
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
                            <h5 className="mb-0">Thông tin liên hệ</h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="mb-1 fw-bold">{booking.CustomerName}</p>
                            <p className="mb-1">
                                <i className="bi bi-telephone me-2"></i>
                                {booking.CustomerPhone}
                            </p>
                            <p className="mb-0">
                                <i className="bi bi-envelope me-2"></i>
                                {booking.CustomerEmail}
                            </p>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Tổng cộng</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Số khung giờ:</span>
                                <span className="fw-bold">{(booking.timeSlots ?? booking.TimeSlots)?.length ?? 0}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Tạm tính:</span>
                                <span>
                                    {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND'
                                    }).format(booking.subTotal ?? booking.SubTotal ?? booking.totalAmount ?? booking.TotalAmount ?? 0)}
                                </span>
                            </div>
                            {(booking.discountAmount ?? booking.DiscountAmount ?? 0) > 0 && (
                                <div className="d-flex justify-content-between mb-2 text-success">
                                    <span>Giảm giá:</span>
                                    <span>
                                        -{new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(booking.discountAmount ?? booking.DiscountAmount)}
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
                                    }).format(booking.totalAmount ?? booking.TotalAmount ?? 0)}
                                </span>
                            </div>
                        </Card.Body>
                    </Card>

                    {(booking.notes ?? booking.Notes) && (
                        <Card className="mt-3 shadow-sm">
                            <Card.Header className="bg-white">
                                <h6 className="mb-0">Ghi chú</h6>
                            </Card.Header>
                            <Card.Body>
                                <p className="mb-0 text-muted">{booking.notes ?? booking.Notes}</p>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default BookingDetail;
