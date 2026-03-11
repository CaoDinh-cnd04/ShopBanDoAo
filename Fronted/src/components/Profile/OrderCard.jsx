import PropTypes from 'prop-types';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaEye, FaStar, FaShoppingBag } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import './OrderCard.css';

const OrderCard = ({ order }) => {
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const canReview = order.status?.toLowerCase() === 'delivered' ||
        order.status?.toLowerCase() === 'đã giao';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5 }}
        >
            <Card className="order-card mb-3 shadow-sm">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <h6 className="mb-0">
                                    <FaShoppingBag className="me-2 text-primary" />
                                    Đơn hàng #{order.OrderID || order.id}
                                </h6>
                                <StatusBadge status={order.Status || order.status} type="order" />
                            </div>

                            <p className="text-muted mb-2 small">
                                Ngày đặt: {formatDate(order.OrderDate || order.orderDate)}
                            </p>

                            {order.items && order.items.length > 0 && (
                                <div className="order-items">
                                    <small className="text-muted">
                                        {order.items.length} sản phẩm
                                    </small>
                                    <div className="d-flex gap-2 mt-2 flex-wrap">
                                        {order.items.slice(0, 3).map((item, index) => (
                                            <Badge key={index} bg="light" text="dark" className="order-item-badge">
                                                {item.productName || item.ProductName}
                                            </Badge>
                                        ))}
                                        {order.items.length > 3 && (
                                            <Badge bg="light" text="dark">
                                                +{order.items.length - 3} khác
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Col>

                        <Col md={4} className="text-md-end">
                            <h5 className="text-primary mb-3">
                                {(order.TotalAmount || order.totalAmount)?.toLocaleString('vi-VN')} ₫
                            </h5>

                            <div className="d-flex gap-2 justify-content-md-end">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => navigate(`/profile/orders/${order.OrderID || order.id}`)}
                                    className="d-inline-flex align-items-center gap-1"
                                >
                                    <FaEye size={14} />
                                    Chi tiết
                                </Button>

                                {canReview && (
                                    <Button
                                        variant="warning"
                                        size="sm"
                                        className="d-inline-flex align-items-center gap-1"
                                    >
                                        <FaStar size={14} />
                                        Đánh giá
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

OrderCard.propTypes = {
    order: PropTypes.shape({
        OrderID: PropTypes.number,
        id: PropTypes.number,
        OrderDate: PropTypes.string,
        orderDate: PropTypes.string,
        TotalAmount: PropTypes.number,
        totalAmount: PropTypes.number,
        Status: PropTypes.string,
        status: PropTypes.string,
        items: PropTypes.arrayOf(
            PropTypes.shape({
                productName: PropTypes.string,
                ProductName: PropTypes.string,
            })
        ),
    }).isRequired,
};

export default OrderCard;
