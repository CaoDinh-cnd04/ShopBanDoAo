import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiMapPin, FiClock, FiCalendar, FiStar,
  FiChevronLeft, FiArrowRight
} from 'react-icons/fi';
import { fetchCourtById } from '../../store/slices/courtSlice';
import { fetchUserBookings } from '../../store/slices/bookingSlice';
import { fetchCourtReviews } from '../../store/slices/reviewSlice';
import ReviewForm from '../../components/Reviews/ReviewForm';
import ReviewList from '../../components/Reviews/ReviewList';
import Loading from '../../components/Loading/Loading';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import './CourtDetail.css';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const CourtDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { court, isLoading } = useSelector((s) => s.courts);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { bookings } = useSelector((s) => s.bookings);
  const { courtReviews } = useSelector((s) => s.reviews);
  const [activeTab, setActiveTab] = useState('info');
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    dispatch(fetchCourtById(id));
    dispatch(fetchCourtReviews(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchUserBookings());
  }, [isAuthenticated, dispatch]);

  const courtIdStr = court ? String(court._id || court.id) : '';
  const eligibleBooking = useMemo(() => {
    if (!court || !bookings?.length) return null;
    return bookings.find((b) => {
      const cid = String(b.courtId?._id ?? b.courtId ?? '');
      const paid = b.paymentStatus === 'DepositPaid';
      return cid === courtIdStr && paid;
    });
  }, [bookings, court, courtIdStr]);

  if (isLoading) return <Loading />;
  if (!court) return (
    <div style={{ textAlign: 'center', padding: '5rem' }}>
      <p>Không tìm thấy sân</p>
      <button onClick={() => navigate('/courts')} style={{ padding: '10px 20px', cursor: 'pointer' }}>← Quay lại</button>
    </div>
  );

  const courtId = court._id || court.id;
  const images = court.images?.length > 0
    ? court.images.map(i => resolveMediaUrl(i.imageUrl) || '/placeholder.svg')
    : [resolveMediaUrl(court.imageUrl || court.image) || '/placeholder.svg'];

  const rating = court.rating || court.averageRating;

  return (
    <div className="cd-page">
      {/* Hero image */}
      <div className="cd-hero">
        <img
          src={images[activeImg]}
          alt={court.courtName}
          className="cd-hero-img"
          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
        />
        <div className="cd-hero-overlay" />
        <div className="cd-hero-content">
          <button className="cd-back-btn" onClick={() => navigate('/courts')}>
            <FiChevronLeft size={18} /> Danh sách sân
          </button>
          {court.courtType?.typeName && (
            <span className="cd-type-badge">{court.courtType.typeName}</span>
          )}
          <h1 className="cd-hero-title">{court.courtName}</h1>
          <div className="cd-hero-meta">
            {court.address && <span><FiMapPin size={14} /> {court.address}</span>}
            {court.openTime && court.closeTime && (
              <span><FiClock size={14} /> {court.openTime} – {court.closeTime}</span>
            )}
            {rating && (
              <span><FiStar size={14} fill="#F59E0B" color="#F59E0B" /> {rating.toFixed(1)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="cd-thumbs-bar">
          <Container>
            <div className="cd-thumbs">
              {images.map((src, i) => (
                <button key={i} className={`cd-thumb ${i === activeImg ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                  <img src={src} alt="" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                </button>
              ))}
            </div>
          </Container>
        </div>
      )}

      <Container className="cd-main">
        <Row className="g-4">
          {/* Left: Tabs */}
          <Col lg={8}>
            <div className="cd-tab-nav">
              {[
                { key: 'info', label: 'Thông tin sân' },
                { key: 'reviews', label: `Đánh giá` },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`cd-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >{tab.label}</button>
              ))}
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="cd-tab-content"
            >
              {activeTab === 'info' && (
                <div>
                  {court.description && (
                    <div className="cd-section">
                      <h3 className="cd-section-title">Mô tả</h3>
                      <p className="cd-desc">{court.description}</p>
                    </div>
                  )}

                  {/* Amenities */}
                  {Array.isArray(court.amenities) && court.amenities.length > 0 && (
                    <div className="cd-section">
                      <h3 className="cd-section-title">Tiện ích</h3>
                      <div className="cd-amenities">
                        {court.amenities.map((a, i) => (
                          <span key={i} className="cd-amenity">✓ {a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rules */}
                  {court.rules && (
                    <div className="cd-section">
                      <h3 className="cd-section-title">Nội quy sân</h3>
                      <p className="cd-desc">{court.rules}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <ReviewForm
                    courtMode
                    courtId={courtId}
                    bookingId={eligibleBooking?._id || eligibleBooking?.id}
                    onSuccess={() => {
                      dispatch(fetchCourtReviews(id));
                      dispatch(fetchUserBookings());
                    }}
                  />
                  {isAuthenticated && !eligibleBooking && (
                    <p className="text-muted small mt-2 mb-3">
                      Đặt sân và thanh toán cọc VNPAY thành công để gửi đánh giá.
                    </p>
                  )}
                  <div style={{ marginTop: '1.5rem' }}>
                    <ReviewList reviews={courtReviews} />
                  </div>
                </div>
              )}
            </motion.div>
          </Col>

          {/* Right: Booking Card */}
          <Col lg={4}>
            <div className="cd-booking-card">
              <div className="cd-price-row">
                <span className="cd-price">{fmt(court.pricePerHour)}</span>
                <span className="cd-price-unit">/giờ</span>
              </div>

              <div className="cd-info-rows">
                {court.openTime && court.closeTime && (
                  <div className="cd-info-row">
                    <FiClock size={15} />
                    <span>Giờ mở cửa: {court.openTime} – {court.closeTime}</span>
                  </div>
                )}
                {court.address && (
                  <div className="cd-info-row">
                    <FiMapPin size={15} />
                    <span>{court.address}</span>
                  </div>
                )}
              </div>

              <motion.button
                className="cd-book-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/booking/${courtId}`)}
              >
                <FiCalendar size={18} /> Đặt sân ngay <FiArrowRight size={16} />
              </motion.button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CourtDetail;
