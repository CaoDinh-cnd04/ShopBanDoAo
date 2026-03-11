import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        type: 'all', // 'product', 'court', 'all'
        isApproved: '',
        rating: ''
    });
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        fetchReviews();
    }, [filters.page, filters.type, filters.isApproved]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await adminService.reviews.getAllReviews(filters);
            setReviews(response.data.data.reviews);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Lỗi khi tải danh sách reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (reviewId, type, currentStatus) => {
        try {
            await adminService.reviews.updateReviewStatus(reviewId, type, !currentStatus);
            toast.success(currentStatus ? 'Từ chối review thành công' : 'Duyệt review thành công');
            fetchReviews();
        } catch (error) {
            console.error('Error updating review status:', error);
            toast.error('Lỗi khi cập nhật trạng thái review');
        }
    };

    const handleDelete = async (reviewId, type) => {
        if (!window.confirm('Bạn có chắc muốn xóa review này?')) return;

        try {
            await adminService.reviews.deleteReview(reviewId, type);
            toast.success('Xóa review thành công');
            fetchReviews();
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error('Lỗi khi xóa review');
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <i
                key={i}
                className={`bi bi-star${i < rating ? '-fill' : ''} text-warning`}
            ></i>
        ));
    };

    return (
        <Container fluid className="admin-page-wrap">
            <h1 className="admin-page-title mb-3">
                <i className="bi bi-star-fill me-2"></i>
                Quản Lý Reviews
            </h1>

            {/* Filters */}
            <Form className="mb-4">
                <Row>
                    <Col md={3}>
                        <Form.Select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                        >
                            <option value="all">Tất cả</option>
                            <option value="product">Sản phẩm</option>
                            <option value="court">Sân</option>
                        </Form.Select>
                    </Col>
                    <Col md={3}>
                        <Form.Select
                            value={filters.isApproved}
                            onChange={(e) => setFilters({ ...filters, isApproved: e.target.value, page: 1 })}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="true">Đã duyệt</option>
                            <option value="false">Chờ duyệt</option>
                        </Form.Select>
                    </Col>
                    <Col md={3}>
                        <Form.Select
                            value={filters.rating}
                            onChange={(e) => setFilters({ ...filters, rating: e.target.value, page: 1 })}
                        >
                            <option value="">Tất cả đánh giá</option>
                            <option value="5">5 sao</option>
                            <option value="4">4 sao</option>
                            <option value="3">3 sao</option>
                            <option value="2">2 sao</option>
                            <option value="1">1 sao</option>
                        </Form.Select>
                    </Col>
                </Row>
            </Form>

            {/* Reviews List */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <>
                    <Row>
                        {reviews.length > 0 ? (
                            reviews.map((review) => (
                                <Col md={12} key={`${review.ReviewType}-${review.ReviewID}`} className="mb-3">
                                    <Card className="shadow-sm">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center mb-2">
                                                        <span className="badge bg-info me-2">{review.ReviewType}</span>
                                                        {renderStars(review.Rating)}
                                                        <span className="ms-2 text-muted">
                                                            {new Date(review.CreatedDate).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    <h6 className="fw-bold">{review.ReviewTitle}</h6>
                                                    <p className="mb-2">{review.ReviewContent}</p>
                                                    <div className="text-muted small">
                                                        <i className="bi bi-person me-1"></i>
                                                        {review.UserName} ({review.UserEmail})
                                                        <span className="mx-2">•</span>
                                                        <i className="bi bi-box me-1"></i>
                                                        {review.ItemName}
                                                    </div>
                                                </div>
                                                <div className="d-flex flex-column gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant={review.IsApproved ? 'success' : 'outline-success'}
                                                        onClick={() => handleApprove(review.ReviewID, review.ReviewType.toLowerCase(), review.IsApproved)}
                                                    >
                                                        <i className={`bi bi-${review.IsApproved ? 'check-circle-fill' : 'check-circle'}`}></i>
                                                        {review.IsApproved ? ' Đã duyệt' : ' Duyệt'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-danger"
                                                        onClick={() => handleDelete(review.ReviewID, review.ReviewType.toLowerCase())}
                                                    >
                                                        <i className="bi bi-trash"></i> Xóa
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))
                        ) : (
                            <Col md={12}>
                                <Card>
                                    <Card.Body className="text-center text-muted py-5">
                                        Không có review nào
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}
                    </Row>

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
        </Container>
    );
};

export default AdminReviews;
