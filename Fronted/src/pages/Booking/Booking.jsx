import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { useDispatch, useSelector } from 'react-redux';
import { FiCalendar, FiClock, FiCheck, FiMapPin, FiArrowLeft } from 'react-icons/fi';
import { fetchCourtById } from '../../store/slices/courtSlice';
import { fetchAvailableSlots, createBooking } from '../../store/slices/bookingSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import './Booking.css';
import 'react-datepicker/dist/react-datepicker.css';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const Booking = () => {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { court } = useSelector((s) => s.courts);
  const { availableSlots, isLoading } = useSelector((s) => s.bookings);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => { dispatch(fetchCourtById(courtId)); }, [courtId, dispatch]);

  useEffect(() => {
    if (selectedDate) {
      dispatch(fetchAvailableSlots({
        courtId,
        date: selectedDate.toISOString().split('T')[0],
      }));
      setSelectedSlots([]); // reset khi đổi ngày
    }
  }, [selectedDate, courtId, dispatch]);

  const toggleSlot = (slotId) => {
    setSelectedSlots(prev =>
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  const totalPrice = (court?.pricePerHour || 0) * selectedSlots.length;

  const handleSubmit = async () => {
    if (selectedSlots.length === 0) { toast.error('Vui lòng chọn ít nhất 1 khung giờ'); return; }
    const res = await dispatch(createBooking({
      courtId: parseInt(courtId),
      bookingDate: selectedDate.toISOString().split('T')[0],
      timeSlotIds: selectedSlots,
    }));
    if (createBooking.fulfilled.match(res)) {
      toast.success('Đặt sân thành công! 🎉');
      navigate('/profile/bookings');
    } else {
      toast.error(res.payload || 'Đặt sân thất bại');
    }
  };

  if (isLoading && !court) return <Loading />;

  return (
    <div className="booking-page">
      <Container>
        {/* Header */}
        <div className="booking-header">
          <button className="booking-back-btn" onClick={() => navigate(`/courts/${courtId}`)}>
            <FiArrowLeft size={16} /> Quay lại
          </button>
          <h1 className="booking-title">Đặt sân</h1>
        </div>

        <Row className="g-4">
          {/* Court info + Calendar */}
          <Col lg={8}>
            {/* Court info card */}
            {court && (
              <div className="booking-court-card">
                <img
                  src={resolveMediaUrl(court.imageUrl || court.image) || '/placeholder.svg'}
                  alt={court.courtName}
                  className="bcc-img"
                  onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                />
                <div className="bcc-info">
                  <span className="bcc-type">{court.courtType?.typeName}</span>
                  <h2 className="bcc-name">{court.courtName}</h2>
                  {court.address && (
                    <p className="bcc-address"><FiMapPin size={13} /> {court.address}</p>
                  )}
                </div>
                <div className="bcc-price">
                  <span className="bcc-price-num">{fmt(court.pricePerHour)}</span>
                  <span className="bcc-price-unit">/giờ</span>
                </div>
              </div>
            )}

            {/* Date picker */}
            <div className="booking-section">
              <h3 className="booking-section-title"><FiCalendar size={18} /> Chọn ngày</h3>
              <div className="booking-datepicker-wrap">
                <DatePicker
                  selected={selectedDate}
                  onChange={(d) => setSelectedDate(d)}
                  minDate={new Date()}
                  inline
                  dateFormat="yyyy-MM-dd"
                />
              </div>
            </div>

            {/* Time slots */}
            <div className="booking-section">
              <h3 className="booking-section-title">
                <FiClock size={18} /> Chọn khung giờ
                <span className="booking-date-label">
                  {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
                </span>
              </h3>

              {isLoading ? (
                <Loading />
              ) : !availableSlots || availableSlots.length === 0 ? (
                <div className="booking-no-slots">
                  <span>😔</span>
                  <p>Không còn khung giờ trống cho ngày này</p>
                </div>
              ) : (
                <div className="booking-slots">
                  {availableSlots.map((slot, i) => {
                    const sid = slot.id || slot._id;
                    const isBooked = slot.isBooked || slot.status === 'booked';
                    const isSelected = selectedSlots.includes(sid);
                    return (
                      <motion.button
                        key={sid}
                        className={`time-slot ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                        onClick={() => !isBooked && toggleSlot(sid)}
                        disabled={isBooked}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        whileTap={!isBooked ? { scale: 0.95 } : {}}
                      >
                        {isSelected && <FiCheck size={13} />}
                        {slot.startTime} – {slot.endTime}
                        {isBooked && <span className="slot-booked-label">Đã đặt</span>}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </Col>

          {/* Summary card */}
          <Col lg={4}>
            <div className="booking-summary-card">
              <h4 className="bs-title">Tóm tắt đặt sân</h4>

              <div className="bs-row">
                <span>Ngày</span>
                <span>{selectedDate.toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="bs-row">
                <span>Số khung giờ</span>
                <span>{selectedSlots.length}</span>
              </div>
              <div className="bs-row">
                <span>Giá/giờ</span>
                <span>{fmt(court?.pricePerHour)}</span>
              </div>

              <hr className="bs-divider" />

              <div className="bs-row bs-total">
                <span>Tổng tiền</span>
                <span className="bs-total-amount">{fmt(totalPrice)}</span>
              </div>

              {/* Selected slots */}
              <AnimatePresence>
                {selectedSlots.length > 0 && (
                  <motion.div
                    className="bs-slots-list"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {availableSlots
                      .filter(s => selectedSlots.includes(s.id || s._id))
                      .map(s => (
                        <span key={s.id || s._id} className="bs-slot-chip">
                          {s.startTime} – {s.endTime}
                        </span>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                className="bs-confirm-btn"
                onClick={handleSubmit}
                disabled={isLoading || selectedSlots.length === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {isLoading ? <span className="auth-spinner" /> : (
                  <><FiCheck size={16} /> Xác nhận đặt sân</>
                )}
              </motion.button>

              <p className="bs-note">Bạn sẽ được xác nhận qua email sau khi đặt thành công</p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Booking;
