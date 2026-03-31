import { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector, useDispatch } from 'react-redux';
import {
  createProductReview,
  createSiteReview,
  createCourtReview,
} from '../../store/slices/reviewSlice';
import { toast } from 'react-toastify';
import { FiStar } from 'react-icons/fi';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

const ReviewForm = ({
  productId,
  siteMode,
  courtMode,
  courtId,
  bookingId,
  onSuccess,
}) => {
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
      <Alert variant="info" className="mb-0">
        Đăng nhập để gửi đánh giá. Nội dung sẽ hiển thị sau khi được quản trị viên duyệt.
      </Alert>
    );
  }

  if (courtMode && (!courtId || !bookingId)) {
    return (
      <Alert variant="secondary" className="mb-0">
        Bạn cần có lịch đặt sân đã thanh toán cọc VNPAY tại sân này để gửi đánh giá.
      </Alert>
    );
  }

  const onSubmit = async (data) => {
    if (!data.rating || data.rating < 1) {
      toast.error('Chọn số sao từ 1 đến 5');
      return;
    }
    try {
      if (siteMode) {
        await dispatch(
          createSiteReview({
            rating: data.rating,
            comment: data.comment?.trim() || undefined,
          }),
        ).unwrap();
      } else if (courtMode && courtId && bookingId) {
        await dispatch(
          createCourtReview({
            courtId,
            bookingId,
            reviewData: {
              rating: data.rating,
              comment: data.comment?.trim() || undefined,
            },
          }),
        ).unwrap();
      } else if (productId) {
        await dispatch(
          createProductReview({
            productId,
            reviewData: {
              rating: data.rating,
              comment: data.comment?.trim() || undefined,
            },
          }),
        ).unwrap();
      }
      toast.success(
        'Đã gửi đánh giá. Nội dung sẽ hiển thị sau khi được duyệt.',
      );
      reset();
      setRating(0);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Gửi đánh giá thất bại');
    }
  };

  const handleRatingClick = (value) => {
    setRating(value);
    setValue('rating', value, { shouldValidate: true });
  };

  const title = siteMode
    ? 'Đánh giá trang web / dịch vụ'
    : courtMode
      ? 'Đánh giá sân'
      : 'Viết đánh giá sản phẩm';

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Header className="bg-white fw-semibold">{title}</Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3">
            <Form.Label>Điểm đánh giá *</Form.Label>
            <div className="d-flex gap-1 align-items-center">
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
            <input type="hidden" {...register('rating', { valueAsNumber: true })} />
            {errors.rating && (
              <Form.Text className="text-danger d-block">{errors.rating.message}</Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Nhận xét (tuỳ chọn)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              {...register('comment')}
              placeholder="Chia sẻ trải nghiệm của bạn..."
            />
            {errors.comment && (
              <Form.Text className="text-danger">{errors.comment.message}</Form.Text>
            )}
          </Form.Group>

          <Button type="submit" variant="primary">
            Gửi đánh giá
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ReviewForm;
