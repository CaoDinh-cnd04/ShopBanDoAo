import { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { createProductReview, createCourtReview } from '../../store/slices/reviewSlice';
import { toast } from 'react-toastify';
import { FiStar } from 'react-icons/fi';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, 'Comment is required'),
});

const ReviewForm = ({ productId, courtId, onSuccess }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  if (!isAuthenticated) {
    return (
      <Alert variant="info">Please login to write a review</Alert>
    );
  }

  const onSubmit = async (data) => {
    try {
      if (productId) {
        await dispatch(
          createProductReview({
            productId,
            reviewData: { rating: data.rating, comment: data.comment },
          })
        );
      } else if (courtId) {
        await dispatch(
          createCourtReview({
            courtId,
            reviewData: { rating: data.rating, comment: data.comment },
          })
        );
      }
      toast.success('Review submitted successfully!');
      reset();
      setRating(0);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const handleRatingClick = (value) => {
    setRating(value);
    setValue('rating', value);
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">{t('product.writeReview')}</h5>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3">
            <Form.Label>Rating *</Form.Label>
            <div className="d-flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  size={30}
                  fill={star <= (hoverRating || rating) ? '#ffc107' : 'none'}
                  color={star <= (hoverRating || rating) ? '#ffc107' : '#ccc'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
            <input type="hidden" {...register('rating')} />
            {errors.rating && (
              <Form.Text className="text-danger">{errors.rating.message}</Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Comment *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              {...register('comment')}
              placeholder="Write your review..."
            />
            {errors.comment && (
              <Form.Text className="text-danger">{errors.comment.message}</Form.Text>
            )}
          </Form.Group>

          <Button type="submit" variant="primary">
            Submit Review
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ReviewForm;
