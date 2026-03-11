import { useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourts, fetchCourtTypes } from '../../store/slices/courtSlice';
import Loading from '../../components/Loading/Loading';
import './Courts.css';

const Courts = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { courts, courtTypes, isLoading } = useSelector((state) => state.courts);

  useEffect(() => {
    dispatch(fetchCourts());
    dispatch(fetchCourtTypes());
  }, [dispatch]);

  return (
    <Container className="py-5">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fw-bold mb-5 text-center gradient-text"
        style={{ fontSize: '2.5rem' }}
      >
        {t('courts.title')}
      </motion.h2>
      {isLoading ? (
        <Loading />
      ) : (
        <Row>
          {courts.map((court, index) => (
            <Col md={4} key={court.id} className="mb-4">
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <Card className="h-100 court-card">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <Card.Img
                      variant="top"
                      src={court.imageUrl || '/placeholder.jpg'}
                      style={{ height: '250px', objectFit: 'cover' }}
                    />
                  </motion.div>
                  <Card.Body>
                    <Card.Title className="fw-bold">{court.courtName}</Card.Title>
                    <Card.Text className="text-muted">{court.courtType?.typeName}</Card.Text>
                    <Card.Text>{court.description}</Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
                      <motion.span
                        className="fw-bold gradient-text fs-5"
                        whileHover={{ scale: 1.1 }}
                      >
                        {court.pricePerHour?.toLocaleString('vi-VN')} ₫/hour
                      </motion.span>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="primary"
                          onClick={() => navigate(`/courts/${court.id}`)}
                        >
                          {t('courts.bookNow')}
                        </Button>
                      </motion.div>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Courts;
