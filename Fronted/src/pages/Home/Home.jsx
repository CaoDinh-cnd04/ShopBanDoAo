import { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowRight, FiShoppingBag, FiCalendar, FiStar, FiUsers, FiPackage } from 'react-icons/fi';
import { fetchProducts } from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchCourts } from '../../store/slices/courtSlice';
import ProductCard from '../../components/ProductCard/ProductCard';
import Loading from '../../components/Loading/Loading';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import adminService from '../../services/adminService';
import { DEFAULT_BANNER } from '../../config/bannerDefaults';
import './Home.css';

const PLACEHOLDER = '/placeholder-category.svg';
const FALLBACK_HERO_IMG =
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&auto=format&fit=crop';

const CTA_ICON_MAP = {
  shopping: FiShoppingBag,
  bag: FiShoppingBag,
  calendar: FiCalendar,
  package: FiPackage,
};

function CtaIcon({ name, size = 18 }) {
  const Icon = CTA_ICON_MAP[name] || FiShoppingBag;
  return <Icon size={size} />;
}

function BadgeIcon({ name, size = 16 }) {
  if (name === 'users') return <FiUsers size={size} />;
  if (name === 'none') return null;
  return <FiStar fill="#F59E0B" color="#F59E0B" size={size} />;
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { featuredProducts, isLoading } = useSelector((s) => s.products);
  const { categories } = useSelector((s) => s.categories);
  const { courts } = useSelector((s) => s.courts);

  useEffect(() => {
    dispatch(fetchProducts({ isFeatured: 1, limit: 8 }));
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    let id;
    const run = () => dispatch(fetchCourts({ limit: 3 }));
    id = typeof requestIdleCallback !== 'undefined' ? requestIdleCallback(run) : setTimeout(run, 1);
    return () => (typeof requestIdleCallback !== 'undefined' ? cancelIdleCallback(id) : clearTimeout(id));
  }, [dispatch]);

  const displayFeatured = Array.isArray(featuredProducts)
    ? featuredProducts.slice(0, 8)
    : [];
  const displayCategories = Array.isArray(categories) ? categories.slice(0, 6) : [];
  const displayCourts = Array.isArray(courts) ? courts.slice(0, 3) : [];

  const [bannerMerged, setBannerMerged] = useState(() => ({ ...DEFAULT_BANNER }));

  const reloadBanner = useCallback(async () => {
    const raw = await adminService.banner.getBanner();
    setBannerMerged({ ...DEFAULT_BANNER, ...(raw || {}) });
  }, []);

  useEffect(() => {
    void reloadBanner();
    const onUpdate = () => {
      void reloadBanner();
    };
    window.addEventListener('site-banner-updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('site-banner-updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [reloadBanner]);

  const heroStyle = bannerMerged
    ? {
        background:
          bannerMerged.showImage && bannerMerged.imageUrl
            ? `linear-gradient(rgba(0,0,0,${bannerMerged.overlayOpacity ?? 0.5}), rgba(0,0,0,${bannerMerged.overlayOpacity ?? 0.5})), url(${bannerMerged.imageUrl}) center/cover no-repeat`
            : `linear-gradient(${bannerMerged.bgAngle ?? 135}deg, ${bannerMerged.bgColor1 ?? '#0f766e'}, ${bannerMerged.bgColor2 ?? '#134e4a'})`,
        color: bannerMerged.textColor || '#fff',
      }
    : undefined;

  return (
    <div className="home-page">
      {/* ══════════════ HERO ══════════════ */}
      <section
        className={`hero-section${bannerMerged?.showImage ? ' hero-section--plain' : ''}`}
        style={heroStyle}
      >
        {!bannerMerged?.showImage && (
          <>
            <div className="hero-bg-blob hero-blob-1" aria-hidden />
            <div className="hero-bg-blob hero-blob-2" aria-hidden />
          </>
        )}

        <Container className="hero-container">
          <Row className="align-items-center g-4">
            <Col lg={6}>
              <motion.div initial="hidden" animate="show" variants={fadeUp}>
                <span className="section-eyebrow">
                  {bannerMerged?.eyebrow ?? '⚡ Sports E-Commerce'}
                </span>
                <h1
                  className="hero-title"
                  style={
                    bannerMerged
                      ? { color: bannerMerged.textColor, whiteSpace: 'pre-line' }
                      : undefined
                  }
                >
                  {bannerMerged?.title ? (
                    bannerMerged.title
                  ) : (
                    <>
                      Trang bị tốt nhất,
                      <br />
                      <span className="gradient-text">chinh phục mọi sân</span>
                    </>
                  )}
                </h1>
                <p
                  className="hero-subtitle"
                  style={
                    bannerMerged ? { color: bannerMerged.textColor, opacity: 0.9 } : undefined
                  }
                >
                  {bannerMerged?.subtitle ||
                    'Hàng nghìn sản phẩm thể thao chính hãng cùng hệ thống đặt sân hiện đại — tất cả trong một nền tảng.'}
                </p>
                <div className="hero-ctas">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      className="btn-primary hero-cta-main"
                      onClick={() => navigate(bannerMerged?.ctaLink || '/courts')}
                    >
                      <CtaIcon name={bannerMerged?.ctaIcon || 'shopping'} size={18} />{' '}
                      {bannerMerged?.ctaText || 'Đặt sân ngay'}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      className="btn-outline hero-cta-secondary"
                      onClick={() => navigate(bannerMerged?.ctaLink2 || '/products')}
                    >
                      <CtaIcon name={bannerMerged?.ctaIcon2 || 'calendar'} size={18} />{' '}
                      {bannerMerged?.ctaText2 || 'Xem sản phẩm'}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </Col>
            <Col lg={6}>
              <motion.div
                className="hero-image-wrap"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <div className="hero-image-glow" aria-hidden />
                <img
                  src={
                    resolveMediaUrl(bannerMerged?.heroImageUrl) ||
                    bannerMerged?.heroImageUrl ||
                    FALLBACK_HERO_IMG
                  }
                  alt=""
                  className="hero-image"
                  fetchPriority="high"
                  decoding="async"
                />
                {(bannerMerged?.showBadge !== false || !bannerMerged) && (
                  <motion.div
                    className="hero-float-badge"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, type: 'spring' }}
                  >
                    <BadgeIcon name={bannerMerged?.badgeIcon || 'star'} size={16} />
                    <span>{bannerMerged?.badgeText || '10,000+ khách hàng'}</span>
                  </motion.div>
                )}
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <section className="stats-section">
        <Container>
          <div className="stats-grid">
            {[
              { icon: FiUsers, value: '10K+', label: 'Khách hàng tin dùng' },
              { icon: FiPackage, value: '500+', label: 'Sản phẩm chính hãng' },
              { icon: FiCalendar, value: '50+', label: 'Sân thể thao' },
              { icon: FiStar, value: '4.9★', label: 'Đánh giá trung bình' },
            ].map(({ icon: Icon, value, label }, i) => (
              <motion.div
                key={label}
                className="stat-item"
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                custom={i}
                viewport={{ once: true }}
              >
                <div className="stat-icon"><Icon size={22} /></div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ══════════════ CATEGORIES ══════════════ */}
      {displayCategories.length > 0 && (
        <section className="categories-section section-py">
          <Container>
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Danh mục</span>
                <h2 className="section-title">Khám phá thể loại</h2>
              </div>
              <button className="see-all-btn" onClick={() => navigate('/products')}>
                Xem tất cả <FiArrowRight size={15} />
              </button>
            </div>
            <Row className="g-3">
              {displayCategories.map((cat, i) => {
                const id = cat.categoryId || cat._id || cat.id;
                return (
                  <Col xs={6} sm={4} md={2} key={id || i}>
                    <motion.div
                      className="category-card"
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="show"
                      custom={i}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.05, y: -6 }}
                      onClick={() => navigate(`/products?category=${id}`)}
                    >
                      <div className="cat-icon-wrap">
                        <img
                          src={resolveMediaUrl(cat.imageUrl) || PLACEHOLDER}
                          alt={cat.categoryName}
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                        />
                      </div>
                      <span className="cat-name">{cat.categoryName}</span>
                    </motion.div>
                  </Col>
                );
              })}
            </Row>
          </Container>
        </section>
      )}

      {/* ══════════════ FEATURED PRODUCTS ══════════════ */}
      <section className="products-section section-py">
        <Container>
          <div className="section-header">
            <div>
              <span className="section-eyebrow">Nổi bật</span>
              <h2 className="section-title">Sản phẩm hot nhất</h2>
            </div>
            <button className="see-all-btn" onClick={() => navigate('/products')}>
              Xem tất cả <FiArrowRight size={15} />
            </button>
          </div>

          {isLoading ? (
            <Loading />
          ) : displayFeatured.length === 0 ? (
            <div className="empty-state">
              <p>Chưa có sản phẩm nổi bật</p>
              <Button className="btn-primary" onClick={() => navigate('/products')}>Xem tất cả sản phẩm</Button>
            </div>
          ) : (
            <Row className="g-4">
              {displayFeatured.map((product, i) => (
                <Col xl={3} lg={4} md={6} key={product.id || product._id}>
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    custom={i % 4}
                    viewport={{ once: true }}
                    style={{ height: '100%' }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* ══════════════ COURTS ══════════════ */}
      {displayCourts.length > 0 && (
        <section className="courts-section section-py">
          <Container>
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Đặt sân</span>
                <h2 className="section-title">Sân thể thao nổi bật</h2>
              </div>
              <button className="see-all-btn" onClick={() => navigate('/courts')}>
                Xem tất cả <FiArrowRight size={15} />
              </button>
            </div>
            <Row className="g-4">
              {displayCourts.map((court, i) => {
                const id = court.id || court._id;
                return (
                  <Col lg={4} md={6} key={id}>
                    <motion.div
                      className="court-card"
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="show"
                      custom={i}
                      viewport={{ once: true }}
                      whileHover={{ y: -8 }}
                      onClick={() => navigate(`/courts/${id}`)}
                    >
                      <div className="court-img-wrap">
                        <img
                          src={resolveMediaUrl(court.imageUrl || court.image) || PLACEHOLDER}
                          alt={court.courtName}
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                        />
                        <div className="court-type-badge">
                          {court.courtType?.typeName || court.courtType}
                        </div>
                      </div>
                      <div className="court-body">
                        <h3 className="court-name">{court.courtName}</h3>
                        <div className="court-price">
                          <span>{(court.pricePerHour || 0).toLocaleString('vi-VN')} ₫</span>
                          <span className="court-price-unit">/giờ</span>
                        </div>
                        <button className="court-book-btn">
                          <FiCalendar size={14} /> Đặt ngay
                        </button>
                      </div>
                    </motion.div>
                  </Col>
                );
              })}
            </Row>
          </Container>
        </section>
      )}

      {/* ══════════════ CTA BANNER ══════════════ */}
      <section className="cta-section">
        <Container>
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="cta-blob" aria-hidden />
            <div className="cta-content">
              <h2>Bắt đầu hành trình thể thao của bạn</h2>
              <p>Đăng ký ngay để nhận ưu đãi 15% cho đơn đầu tiên!</p>
              <div className="cta-actions">
                <Button className="btn-primary" onClick={() => navigate('/register')}>
                  Đăng ký miễn phí
                </Button>
                <Button className="btn-ghost" onClick={() => navigate('/products')}>
                  Khám phá sản phẩm
                </Button>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
};

export default Home;
