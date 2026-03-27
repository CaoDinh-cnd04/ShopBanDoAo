import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';
import { fetchCourts, fetchCourtTypes } from '../../store/slices/courtSlice';
import Loading from '../../components/Loading/Loading';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import './Courts.css';

const PLACEHOLDER = '/placeholder-category.svg';

const Courts = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { courts, courtTypes, isLoading } = useSelector((s) => s.courts);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    dispatch(fetchCourts());
    dispatch(fetchCourtTypes());
  }, [dispatch]);

  const safeCourts = Array.isArray(courts) ? courts : [];
  const safeTypes = Array.isArray(courtTypes) ? courtTypes : [];

  const filtered = safeCourts.filter((c) => {
    const matchSearch = !search || c.courtName?.toLowerCase().includes(search.toLowerCase());
    const matchType = activeType === 'all' || c.courtType?._id === activeType || c.courtType?.id === activeType;
    return matchSearch && matchType;
  });

  return (
    <div className="courts-page">
      {/* Hero */}
      <section className="courts-hero">
        <div className="courts-hero-blob c-blob-1" />
        <div className="courts-hero-blob c-blob-2" />
        <Container className="courts-hero-inner">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-eyebrow">⚽ Đặt sân thể thao</span>
            <h1 className="courts-hero-title">
              Tìm sân <span className="gradient-text">phù hợp</span> với bạn
            </h1>
            <p className="courts-hero-sub">
              Hơn 50 sân thể thao: Tennis, Cầu lông, Bóng đá, Bóng rổ — đặt & thanh toán ngay
            </p>

            {/* Search bar */}
            <div className="courts-search-bar">
              <FiSearch className="courts-search-icon" size={18} />
              <input
                className="courts-search-input"
                placeholder="Tìm kiếm tên sân..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Main content */}
      <Container className="courts-main">
        {/* Filter chips */}
        {safeTypes.length > 0 && (
          <div className="courts-filter-bar">
            <button
              className={`chip ${activeType === 'all' ? 'active' : ''}`}
              onClick={() => setActiveType('all')}
            >Tất cả</button>
            {safeTypes.map((type) => {
              const id = type._id || type.id;
              return (
                <button
                  key={id}
                  className={`chip ${activeType === id ? 'active' : ''}`}
                  onClick={() => setActiveType(id)}
                >{type.typeName}</button>
              );
            })}
          </div>
        )}

        {/* Count */}
        {!isLoading && (
          <p className="courts-count">{filtered.length} sân tìm thấy</p>
        )}

        {/* Grid */}
        {isLoading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <div className="courts-empty">
            <div style={{ fontSize: '3rem' }}>🏟️</div>
            <h3>Không tìm thấy sân</h3>
            <p>Thử tìm kiếm với từ khoá khác</p>
          </div>
        ) : (
          <Row className="g-4">
            {filtered.map((court, i) => {
              const id = court._id || court.id;
              return (
                <Col xl={4} md={6} key={id}>
                  <motion.div
                    className="court-listing-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 6) * 0.06 }}
                    whileHover={{ y: -8 }}
                    onClick={() => navigate(`/courts/${id}`)}
                  >
                    {/* Image */}
                    <div className="clc-img-wrap">
                      <img
                        src={resolveMediaUrl(court.imageUrl || court.image) || PLACEHOLDER}
                        alt={court.courtName}
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                        loading="lazy"
                      />
                      {court.courtType?.typeName && (
                        <span className="clc-type-tag">{court.courtType.typeName}</span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="clc-body">
                      <h3 className="clc-name">{court.courtName}</h3>
                      {court.description && (
                        <p className="clc-desc">{court.description}</p>
                      )}
                      <div className="clc-meta">
                        {court.address && (
                          <span className="clc-meta-item">
                            <FiMapPin size={13} /> {court.address}
                          </span>
                        )}
                        {court.openTime && court.closeTime && (
                          <span className="clc-meta-item">
                            <FiClock size={13} /> {court.openTime} – {court.closeTime}
                          </span>
                        )}
                      </div>
                      <div className="clc-footer">
                        <div className="clc-price">
                          <span>{(court.pricePerHour || 0).toLocaleString('vi-VN')} ₫</span>
                          <span className="clc-price-unit">/giờ</span>
                        </div>
                        <button className="clc-book-btn">
                          <FiCalendar size={14} /> Đặt ngay
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Courts;
