import { Card } from 'react-bootstrap';
import { FiStar } from 'react-icons/fi';
import './ReviewList.css';

function displayName(review) {
  const u = review.userId;
  if (u && typeof u === 'object') {
    const n = u.fullName ?? u.name ?? '';
    if (n) return n;
    if (u.email) return String(u.email).split('@')[0];
  }
  return 'Khách hàng';
}

const ReviewList = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <p className="text-muted mb-0">
        Chưa có đánh giá nào được hiển thị. Các đánh giá mới sẽ xuất hiện sau khi được duyệt.
      </p>
    );
  }

  return (
    <div className="review-list">
      {reviews.map((review) => {
        const key = review._id ?? review.id ?? review.reviewId;
        const created = review.createdAt ?? review.createdDate;
        const t = created ? new Date(created) : null;
        return (
          <Card key={key} className="mb-3 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong>{displayName(review)}</strong>
                  <div className="d-flex align-items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        size={16}
                        fill={star <= (review.rating || 0) ? '#ffc107' : 'none'}
                        color={star <= (review.rating || 0) ? '#ffc107' : '#ccc'}
                      />
                    ))}
                    <span className="ms-2 text-muted small">
                      {t && !Number.isNaN(t.getTime()) ? t.toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                </div>
              </div>
              {review.comment ? (
                <p className="mb-0 text-body">{review.comment}</p>
              ) : (
                <p className="mb-0 text-muted small">(Không có nhận xét)</p>
              )}
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
};

export default ReviewList;
