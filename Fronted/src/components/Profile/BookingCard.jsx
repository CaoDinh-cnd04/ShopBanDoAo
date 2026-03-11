import PropTypes from 'prop-types';
import { Card, Button, Row, Col, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaEye, FaTimesCircle, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import './BookingCard.css';

const BookingCard = ({ booking, onCancel }) => {
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        return timeString.substring(0, 5); // HH:MM
    };

    const canCancel = booking.Status?.toLowerCase() === 'confirmed' ||
        booking.status?.toLowerCase() === 'đã xác nhận' ||
        booking.Status?.toLowerCase() === 'pending';

    const isUpcoming = () => {
        const bookingDate = new Date(booking.BookingDate || booking.bookingDate);
        return bookingDate > new Date();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5 }}
        >
            <Card className="booking-card mb-3 shadow-sm">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <h6 className="mb-0 fw-bold">
                                    {booking.court?.CourtName || booking.court?.courtName || 'Sân thể thao'}
                                </h6>
                                <StatusBadge status={booking.Status || booking.status} type="booking" />
                                {isUpcoming() && (
                                    <Badge bg="info" className="d-inline-flex align-items-center gap-1">
                                        <FaClock size={12} />
                                        Sắp tới
                                    </Badge>
                                )}
                            </div>

                            <div className="booking-details">
                                <p className="mb-1 small text-muted d-flex align-items-center gap-2">
                                    <FaMapMarkerAlt />
                                    {booking.court?.Location || booking.court?.location || 'Địa chỉ sân'}
                                </p>

                                <p className="mb-1 small">
                                    <strong>Ngày:</strong> {formatDate(booking.BookingDate || booking.bookingDate)}
                                </p>

                                {booking.timeSlots && booking.timeSlots.length > 0 && (
                                    <p className="mb-0 small">
                                        <strong>Giờ:</strong>{' '}
                                        {booking.timeSlots.map((slot) =>
                                            formatTime(slot.StartTime || slot.startTime)
                                        ).join(', ')}
                                    </p>
                                )}
                            </div>
                        </Col>

                        <Col md={4} className="text-md-end">
                            <h5 className="text-primary mb-3">
                                {(booking.TotalAmount || booking.totalAmount)?.toLocaleString('vi-VN')} ₫
                            </h5>

                            <div className="d-flex gap-2 justify-content-md-end flex-wrap">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => navigate(`/profile/bookings/${booking.BookingID || booking.id}`)}
                                    className="d-inline-flex align-items-center gap-1"
                                >
                                    <FaEye size={14} />
                                    Chi tiết
                                </Button>

                                {canCancel && (
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => onCancel?.(booking.BookingID || booking.id)}
                                        className="d-inline-flex align-items-center gap-1"
                                    >
                                        <FaTimesCircle size={14} />
                                        Hủy
                                    </Button>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </motion.div>
    );
};

BookingCard.propTypes = {
    booking: PropTypes.shape({
        BookingID: PropTypes.number,
        id: PropTypes.number,
        BookingDate: PropTypes.string,
        bookingDate: PropTypes.string,
        TotalAmount: PropTypes.number,
        totalAmount: PropTypes.number,
        Status: PropTypes.string,
        status: PropTypes.string,
        court: PropTypes.shape({
            CourtName: PropTypes.string,
            courtName: PropTypes.string,
            Location: PropTypes.string,
            location: PropTypes.string,
        }),
        timeSlots: PropTypes.arrayOf(
            PropTypes.shape({
                StartTime: PropTypes.string,
                startTime: PropTypes.string,
            })
        ),
    }).isRequired,
    onCancel: PropTypes.func,
};

export default BookingCard;
