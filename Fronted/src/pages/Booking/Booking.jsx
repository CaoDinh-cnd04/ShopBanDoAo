import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourtById } from '../../store/slices/courtSlice';
import { fetchAvailableSlots, createBooking } from '../../store/slices/bookingSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';
import './Booking.css';

const Booking = () => {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { court } = useSelector((state) => state.courts);
  const { availableSlots, isLoading } = useSelector((state) => state.bookings);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => {
    dispatch(fetchCourtById(courtId));
  }, [courtId, dispatch]);

  useEffect(() => {
    if (selectedDate) {
      dispatch(fetchAvailableSlots({ courtId, date: selectedDate.toISOString().split('T')[0] }));
    }
  }, [selectedDate, courtId, dispatch]);

  const handleSlotToggle = (slotId) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleSubmit = async () => {
    if (selectedSlots.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }

    const bookingData = {
      courtId: parseInt(courtId),
      bookingDate: selectedDate.toISOString().split('T')[0],
      timeSlotIds: selectedSlots,
    };

    const result = await dispatch(createBooking(bookingData));
    if (createBooking.fulfilled.match(result)) {
      toast.success('Booking created successfully!');
      navigate('/profile/bookings');
    } else {
      toast.error(result.payload || 'Failed to create booking');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <Container className="py-5">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fw-bold mb-4 gradient-text"
        style={{ fontSize: '2.5rem' }}
      >
        {t('courts.book')}
      </motion.h2>
      <Row>
        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-4">
              <Card.Body>
                <h4 className="fw-bold mb-3">{court?.courtName}</h4>
                <p className="text-muted">{court?.courtType?.typeName}</p>
                <p className="fw-bold gradient-text fs-4">
                  {court?.pricePerHour?.toLocaleString('vi-VN')} ₫/hour
                </p>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h5 className="mb-0">{t('courts.selectDate')}</h5>
              </Card.Header>
              <Card.Body>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  minDate={new Date()}
                  className="form-control"
                  dateFormat="yyyy-MM-dd"
                />
              </Card.Body>
            </Card>
          </motion.div>
        </Col>

        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <Card.Header>
                <h5 className="mb-0">{t('courts.selectTime')}</h5>
              </Card.Header>
              <Card.Body>
                {availableSlots.length === 0 ? (
                  <p className="text-muted">No available slots for this date</p>
                ) : (
                  <div className="d-flex flex-wrap gap-2">
                    {availableSlots.map((slot, index) => (
                      <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant={selectedSlots.includes(slot.id) ? 'primary' : 'outline-primary'}
                          onClick={() => handleSlotToggle(slot.id)}
                        >
                          {slot.startTime} - {slot.endTime}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {selectedSlots.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="mt-4 border-primary">
                  <Card.Body>
                    <h5 className="mb-3 gradient-text">Booking Summary</h5>
                    <p>Date: {selectedDate.toLocaleDateString()}</p>
                    <p>Time Slots: {selectedSlots.length}</p>
                    <motion.p
                      className="fw-bold gradient-text fs-4"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      Total: {(court?.pricePerHour * selectedSlots.length).toLocaleString('vi-VN')} ₫
                    </motion.p>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-100"
                        onClick={handleSubmit}
                        disabled={isLoading}
                      >
                        Confirm Booking
                      </Button>
                    </motion.div>
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </Col>
      </Row>
    </Container>
  );
};

export default Booking;
