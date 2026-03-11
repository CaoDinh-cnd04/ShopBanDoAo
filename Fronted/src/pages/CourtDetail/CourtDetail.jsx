import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Tabs, Tab } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourtById } from '../../store/slices/courtSlice';
import ReviewForm from '../../components/Reviews/ReviewForm';
import ReviewList from '../../components/Reviews/ReviewList';
import Loading from '../../components/Loading/Loading';
import './CourtDetail.css';

const CourtDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { court, isLoading } = useSelector((state) => state.courts);

  useEffect(() => {
    dispatch(fetchCourtById(id));
  }, [id, dispatch]);

  if (isLoading) return <Loading />;
  if (!court) return <div>Court not found</div>;

  return (
    <Container className="py-5">
      <Row>
        <Col md={6}>
          <img
            src={court.imageUrl || '/placeholder.jpg'}
            alt={court.courtName}
            className="img-fluid rounded mb-4"
          />
        </Col>
        <Col md={6}>
          <h1 className="fw-bold mb-3">{court.courtName}</h1>
          <p className="text-muted mb-3">{court.courtType?.typeName}</p>
          <p className="mb-4">{court.description}</p>
          <div className="mb-4">
            <h3 className="fw-bold text-accent">
              {court.pricePerHour?.toLocaleString('vi-VN')} ₫/hour
            </h3>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(`/booking/${court.id}`)}
          >
            {t('courts.book')}
          </Button>
        </Col>
      </Row>
      <Row className="mt-5">
        <Col>
          <Tabs defaultActiveKey="description">
            <Tab eventKey="description" title="Description">
              <div className="p-3">
                <p>{court.description || 'No description available.'}</p>
              </div>
            </Tab>
            <Tab eventKey="reviews" title="Reviews">
              <div className="p-3">
                <ReviewForm
                  courtId={court.id}
                  onSuccess={() => window.location.reload()}
                />
                <div className="mt-4">
                  <h5 className="mb-3">Customer Reviews</h5>
                  <ReviewList reviews={[]} />
                </div>
              </div>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default CourtDetail;
