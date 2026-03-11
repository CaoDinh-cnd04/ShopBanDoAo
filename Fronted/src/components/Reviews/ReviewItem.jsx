import { Card } from 'react-bootstrap';
import RatingStars from './RatingStars';

const ReviewItem = ({ review }) => {
    return (
        <Card className="mb-3 shadow-sm">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <RatingStars rating={review.Rating} />
                        <h6 className="fw-bold mt-2 mb-1">{review.ReviewTitle}</h6>
                    </div>
                    <small className="text-muted">
                        {new Date(review.CreatedDate).toLocaleDateString('vi-VN')}
                    </small>
                </div>

                <p className="mb-2">{review.ReviewContent}</p>

                <div className="text-muted small">
                    <i className="bi bi-person-circle me-1"></i>
                    {review.UserName || 'Người dùng'}
                    {review.IsVerifiedPurchase && (
                        <span className="badge bg-success ms-2">
                            <i className="bi bi-check-circle me-1"></i>
                            Đã mua hàng
                        </span>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default ReviewItem;
