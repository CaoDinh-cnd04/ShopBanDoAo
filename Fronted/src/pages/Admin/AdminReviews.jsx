import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const buildReviewParams = (f) => {
  const params = {
    page: f.page,
    limit: f.limit,
    type: f.type || 'all'
  };
  if (f.isApproved !== '') params.isApproved = f.isApproved;
  if (f.rating) params.rating = f.rating;
  return params;
};

const typeLabel = (t) => {
  const s = (t || '').toString();
  if (s.toLowerCase() === 'product') return 'Sản phẩm';
  if (s.toLowerCase() === 'court') return 'Sân';
  return s;
};

const AdminReviews = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  const filters = useMemo(
    () => ({
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1),
      limit: 20,
      type: searchParams.get('type') || 'all',
      isApproved: searchParams.get('isApproved') ?? '',
      rating: searchParams.get('rating') || ''
    }),
    [searchParams]
  );

  const patchParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null || v === undefined) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = buildReviewParams(filters);
      const response = await adminService.reviews.getAllReviews(params);
      const payload = response.data?.data;
      setReviews(Array.isArray(payload?.reviews) ? payload.reviews : []);
      setPagination(payload?.pagination ?? null);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Lỗi khi tải danh sách reviews');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const reviewTypeKey = (review) =>
    ((review.reviewType ?? review.ReviewType) || '').toLowerCase() === 'court' ? 'court' : 'product';

  const handleApprove = async (review, currentApproved) => {
    const reviewId = review.reviewId ?? review.ReviewID ?? review._id;
    try {
      await adminService.reviews.updateReviewStatus(reviewId, reviewTypeKey(review), !currentApproved);
      toast.success(currentApproved ? 'Đã từ chối hiển thị' : 'Đã duyệt');
      fetchReviews();
    } catch (error) {
      console.error('Error updating review status:', error);
      toast.error('Lỗi khi cập nhật trạng thái review');
    }
  };

  const handleDelete = async (review) => {
    if (!window.confirm('Bạn có chắc muốn xóa review này?')) return;

    const reviewId = review.reviewId ?? review.ReviewID ?? review._id;
    try {
      await adminService.reviews.deleteReview(reviewId, reviewTypeKey(review));
      toast.success('Xóa review thành công');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Lỗi khi xóa review');
    }
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <i key={i} className={`bi bi-star${i < rating ? '-fill' : ''} text-warning`} />
    ));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Đánh giá</h1>
          <div className="admin-page-subtitle">
            Lọc theo loại (sản phẩm / sân), trạng thái duyệt, số sao — tham số đồng bộ URL (
            <code>?type=product&amp;isApproved=false</code>).
          </div>
        </div>
      </div>

      <Card className="admin-panel mb-3">
        <Card.Body className="admin-panel-body">
          <Row className="g-2">
            <Col md={3}>
              <Form.Label className="small text-muted">Loại</Form.Label>
              <Form.Select
                value={filters.type}
                onChange={(e) => patchParams({ type: e.target.value, page: '' })}
              >
                <option value="all">Tất cả</option>
                <option value="product">Sản phẩm</option>
                <option value="court">Sân</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted">Duyệt</Form.Label>
              <Form.Select
                value={filters.isApproved}
                onChange={(e) => patchParams({ isApproved: e.target.value, page: '' })}
              >
                <option value="">Tất cả</option>
                <option value="true">Đã duyệt</option>
                <option value="false">Chờ duyệt</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="small text-muted">Số sao</Form.Label>
              <Form.Select
                value={filters.rating}
                onChange={(e) => patchParams({ rating: e.target.value, page: '' })}
              >
                <option value="">Tất cả</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          <Row>
            {reviews.length > 0 ? (
              reviews.map((review) => {
                const rt = review.reviewType ?? review.ReviewType;
                const isCourt = (rt || '').toLowerCase() === 'court';
                const approved = !!(review.isApproved ?? review.IsApproved);
                return (
                  <Col md={12} key={`${rt}-${review.reviewId ?? review._id}`} className="mb-3">
                    <Card className="admin-panel">
                      <Card.Body className="admin-panel-body">
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2 flex-wrap gap-2">
                              <Badge bg={isCourt ? 'warning' : 'info'}>{typeLabel(rt)}</Badge>
                              {renderStars(review.rating ?? review.Rating)}
                              <span className="text-muted small">
                                {new Date(review.createdDate ?? review.CreatedDate).toLocaleString('vi-VN')}
                              </span>
                              {approved ? (
                                <Badge bg="success">Đã duyệt</Badge>
                              ) : (
                                <Badge bg="secondary">Chờ duyệt</Badge>
                              )}
                            </div>
                            <h6 className="fw-bold mb-2">{review.reviewTitle ?? review.ReviewTitle}</h6>
                            <p className="mb-2 text-dark">{review.reviewContent ?? review.ReviewContent}</p>
                            <div className="small text-muted">
                              <i className="bi bi-person me-1"></i>
                              {review.userName ?? review.UserName} ({review.userEmail ?? review.UserEmail})
                              <span className="mx-2">•</span>
                              <i className="bi bi-box me-1"></i>
                              {review.itemName ?? review.ItemName}
                            </div>
                          </div>
                          <div className="d-flex flex-column gap-2">
                            <Button
                              size="sm"
                              variant={approved ? 'success' : 'outline-success'}
                              onClick={() => handleApprove(review, approved)}
                            >
                              <i
                                className={`bi bi-${approved ? 'check-circle-fill' : 'check-circle'} me-1`}
                              ></i>
                              {approved ? 'Đã duyệt' : 'Duyệt'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDelete(review)}
                            >
                              <i className="bi bi-trash me-1"></i> Xóa
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            ) : (
              <Col md={12}>
                <Card className="admin-panel">
                  <Card.Body className="text-center py-5 text-muted">
                    Không có review nào
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>

          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-primary"
                disabled={filters.page === 1}
                onClick={() => patchParams({ page: filters.page - 1 > 1 ? String(filters.page - 1) : '' })}
              >
                Trước
              </Button>
              <span className="mx-3 align-self-center">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline-primary"
                disabled={filters.page === pagination.totalPages}
                onClick={() => patchParams({ page: String(filters.page + 1) })}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReviews;
