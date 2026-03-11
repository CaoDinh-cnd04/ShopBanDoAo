import { Card } from 'react-bootstrap';
import { FiStar } from 'react-icons/fi';
import './ReviewList.css';

const ReviewList = ({ reviews }) => {
  if (!reviews || reviews.length === 0) {
    return <p className="text-muted">No reviews yet. Be the first to review!</p>;
  }

  return (
    <div className="review-list">
      {reviews.map((review) => (
        <Card key={review.id} className="mb-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <strong>{review.user?.firstName} {review.user?.lastName}</strong>
                <div className="d-flex align-items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      size={16}
                      fill={star <= review.rating ? '#ffc107' : 'none'}
                      color={star <= review.rating ? '#ffc107' : '#ccc'}
                    />
                  ))}
                  <span className="ms-2 text-muted small">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <p className="mb-0">{review.comment}</p>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default ReviewList;
