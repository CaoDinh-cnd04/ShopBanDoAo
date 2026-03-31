import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Row, Col, Card, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { FiUser, FiPackage, FiCheck, FiEyeOff, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const buildReviewParams = (f) => {
  const params = {
    page: f.page,
    limit: f.limit,
  };
  if (f.type && f.type !== 'all') params.type = f.type;
  if (f.isApproved !== '') params.isApproved = f.isApproved;
  if (f.rating) params.rating = f.rating;
  return params;
};

const reviewMongoId = (review) =>
  review?._id?.toString?.() || review?.reviewId?.toString?.() || review?.ReviewID?.toString?.();

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
      rating: searchParams.get('rating') || '',
    }),
    [searchParams],
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
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Lỗi khi tải danh sách reviews',
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApproveToggle = async (review, currentlyVisible) => {
    const id = reviewMongoId(review);
    if (!id) return;
    try {
      await adminService.reviews.updateReviewStatus(id, 'product', !currentlyVisible);
      toast.success(currentlyVisible ? 'Đã ẩn khỏi trang công khai' : 'Đã duyệt hiển thị');
      fetchReviews();
    } catch (error) {
      console.error('Error updating review status:', error);
      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Lỗi khi cập nhật trạng thái review',
      );
    }
  };

  const handleDelete = async (review) => {
    if (!window.confirm('Xóa vĩnh viễn đánh giá này?')) return;
    const id = reviewMongoId(review);
    if (!id) return;
    try {
      await adminService.reviews.deleteReview(id);
      toast.success('Đã xóa đánh giá');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Lỗi khi xóa review');
    }
  };

  const renderStars = (rating) => {
    const r = Math.min(5, Math.max(0, Number(rating) || 0));
    return (
      <span className="user-select-none" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < r ? 'text-warning' : 'text-muted'} style={{ opacity: i < r ? 1 : 0.35 }}>
            ★
          </span>
        ))}
      </span>
    );
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const totalCount =
    pagination?.totalItems ?? pagination?.totalReviews ?? pagination?.total ?? reviews.length;

  const userLabel = (review) => {
    const u = review.userId;
    if (u && typeof u === 'object') {
      const name = u.fullName ?? u.name ?? '';
      const email = u.email ?? '';
      if (name && email) return `${name} (${email})`;
      return name || email || '—';
    }
    return review.userName ?? review.UserName ?? '—';
  };

  const productLabel = (review) => {
    const p = review.productId;
    if (p && typeof p === 'object') return p.productName ?? p.name ?? '—';
    return review.itemName ?? review.ItemName ?? '—';
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Đánh giá</h1>
          <div className="admin-page-subtitle">
            Duyệt hiển thị, ẩn hoặc xóa đánh giá theo bộ lọc bên dưới.
          </div>
        </div>
      </div>

      <Card className="admin-panel mb-3">
        <Card.Body className="admin-panel-body">
          <Row className="g-2 align-items-end">
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
            <Col md={3}>
              <Button type="button" variant="outline-secondary" className="w-100" title="Xóa bộ lọc" onClick={clearFilters}>
                <FiX size={18} className="me-1" /> Xóa lọc
              </Button>
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
          <div className="mb-2 text-muted small">Tổng: {totalCount} đánh giá</div>
          <Row>
            {reviews.length > 0 ? (
              reviews.map((review, idx) => {
                const id = reviewMongoId(review);
                const isCourt = false;
                const visible = review.isVisible !== false && review.IsVisible !== false;
                const created = review.createdAt ?? review.createdDate ?? review.CreatedDate;
                const t = created ? new Date(created) : null;
                const rating = review.rating ?? review.Rating ?? 0;
                const comment = review.comment ?? review.reviewContent ?? review.ReviewContent ?? '';

                return (
                  <Col md={12} key={id || `review-${idx}`} className="mb-3">
                    <Card className="admin-panel">
                      <Card.Body className="admin-panel-body">
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2 flex-wrap gap-2">
                              <Badge bg={isCourt ? 'warning' : 'info'}>Sản phẩm</Badge>
                              {renderStars(rating)}
                              <span className="text-muted small">
                                {t && !Number.isNaN(t.getTime()) ? t.toLocaleString('vi-VN') : '—'}
                              </span>
                              {visible ? (
                                <Badge bg="success">Đã duyệt</Badge>
                              ) : (
                                <Badge bg="secondary">Chờ duyệt</Badge>
                              )}
                            </div>
                            <p className="mb-2 text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                              {comment || '—'}
                            </p>
                            <div className="small text-muted">
                              <FiUser className="me-1 d-inline" />
                              {userLabel(review)}
                              <span className="mx-2">•</span>
                              <FiPackage className="me-1 d-inline" />
                              {productLabel(review)}
                            </div>
                          </div>
                          <div className="d-flex flex-column gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant={visible ? 'outline-warning' : 'success'}
                              onClick={() => handleApproveToggle(review, visible)}
                            >
                              {visible ? (
                                <>
                                  <FiEyeOff className="me-1" /> Ẩn
                                </>
                              ) : (
                                <>
                                  <FiCheck className="me-1" /> Duyệt
                                </>
                              )}
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(review)}>
                              <FiTrash2 className="me-1" /> Xóa
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
                  <Card.Body className="text-center py-5 text-muted">Không có review nào</Card.Body>
                </Card>
              </Col>
            )}
          </Row>

          {pagination && pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Button
                variant="outline-primary"
                disabled={filters.page <= 1}
                onClick={() => patchParams({ page: filters.page - 1 > 1 ? String(filters.page - 1) : '' })}
              >
                Trước
              </Button>
              <span className="mx-3 align-self-center">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline-primary"
                disabled={filters.page >= pagination.totalPages}
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
