import { useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSiteReviews } from '../../store/slices/reviewSlice';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';

/**
 * Đánh giá trang web — gửi qua API (chờ admin duyệt), hiển thị các đánh giá đã duyệt.
 */
const SiteReviewsSection = () => {
  const dispatch = useDispatch();
  const { siteReviews } = useSelector((s) => s.reviews);

  useEffect(() => {
    dispatch(fetchSiteReviews());
  }, [dispatch]);

  return (
    <section className="py-5 bg-light border-top">
      <Container>
        <Row className="g-4">
          <Col lg={5}>
            <h2 className="h4 fw-bold mb-2">Đánh giá trải nghiệm</h2>
            <p className="text-muted small mb-3">
              Mỗi tài khoản chỉ gửi một lần. Nội dung hiển thị công khai sau khi được duyệt.
            </p>
            <ReviewForm
              siteMode
              onSuccess={() => dispatch(fetchSiteReviews())}
            />
          </Col>
          <Col lg={7}>
            <h3 className="h5 fw-semibold mb-3">Khách hàng nói gì</h3>
            <ReviewList reviews={siteReviews} />
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default SiteReviewsSection;
