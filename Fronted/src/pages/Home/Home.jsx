import { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowRight, FiShoppingBag, FiCalendar, FiStar, FiTag, FiPackage } from 'react-icons/fi';
import { fetchTopSellingProducts } from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchCourts } from '../../store/slices/courtSlice';
import ProductCard from '../../components/ProductCard/ProductCard';
import Loading from '../../components/Loading/Loading';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import adminService from '../../services/adminService';
import { DEFAULT_BANNER } from '../../config/bannerDefaults';
import { getDiscountForCategory } from '../../services/promotionService';
import SiteReviewsSection from '../../components/Reviews/SiteReviewsSection';
import api from '../../services/api';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { featuredProducts, isLoading } = useSelector((s) => s.products);
  const { categories } = useSelector((s) => s.categories);
  const { courts } = useSelector((s) => s.courts);
  const activePromotions = useSelector((s) => s.promotions?.active ?? []);

  useEffect(() => {
    dispatch(fetchTopSellingProducts({ limit: 8 }));
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
  const displayCategories = Array.isArray(categories) ? categories : [];
  const displayCourts = Array.isArray(courts) ? courts.slice(0, 3) : [];

  // { [categoryId]: Product[] }
  const [catProducts, setCatProducts] = useState({});

  // Fetch top-4 products for each category (idle callback để không block)
  useEffect(() => {
    if (!Array.isArray(categories) || categories.length === 0) return;
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        categories.map(async (cat) => {
          const id = String(cat.categoryId || cat._id || cat.id || '');
          if (!id) return null;
          try {
            const res = await api.get('/products', {
              params: { category: id, limit: 4, page: 1, sort: 'newest' },
            });
            const list = Array.isArray(res.data?.products)
              ? res.data.products
              : Array.isArray(res.data?.data)
              ? res.data.data
              : [];
            return [id, list.slice(0, 4)];
          } catch {
            return null;
          }
        }),
      );
      if (!cancelled) {
        const map = {};
        for (const entry of entries) {
          if (entry) map[entry[0]] = entry[1];
        }
        setCatProducts(map);
      }
    };
    const id =
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(load)
        : setTimeout(load, 50);
    return () => {
      cancelled = true;
      typeof requestIdleCallback !== 'undefined' ? cancelIdleCallback(id) : clearTimeout(id);
    };
  }, [categories]);

  const [bannerMerged, setBannerMerged] = useState(() => ({ ...DEFAULT_BANNER }));

  const reloadBanner = useCallback(async () => {
    const raw = await adminService.banner.getBanner();
    setBannerMerged({ ...DEFAULT_BANNER, ...(raw || {}) });
  }, []);

  useEffect(() => {
    void reloadBanner();
    const onUpdate = () => { void reloadBanner(); };
    window.addEventListener('site-banner-updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('site-banner-updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [reloadBanner]);

  const [promos, setPromos] = useState([]);

  const reloadPromos = useCallback(async () => {
    const data = await adminService.promos.getPromos();
    setPromos(Array.isArray(data) ? data.filter((p) => p.isActive !== false) : []);
  }, []);

  useEffect(() => {
    void reloadPromos();
    window.addEventListener('site-promos-updated', reloadPromos);
    return () => window.removeEventListener('site-promos-updated', reloadPromos);
  }, [reloadPromos]);

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
                  {bannerMerged?.eyebrow ?? t('home.defaultEyebrow')}
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
                      {t('home.defaultTitleLine1')}
                      <br />
                      <span className="gradient-text">{t('home.defaultTitleLine2')}</span>
                    </>
                  )}
                </h1>
                <p
                  className="hero-subtitle"
                  style={
                    bannerMerged ? { color: bannerMerged.textColor, opacity: 0.9 } : undefined
                  }
                >
                  {bannerMerged?.subtitle || t('home.defaultSubtitle')}
                </p>
                <div className="hero-ctas">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      className="btn-primary hero-cta-main"
                      onClick={() => navigate(bannerMerged?.ctaLink || '/courts')}
                    >
                      <CtaIcon name={bannerMerged?.ctaIcon || 'shopping'} size={18} />{' '}
                      {bannerMerged?.ctaText || t('home.defaultCtaPrimary')}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      className="btn-outline hero-cta-secondary"
                      onClick={() => navigate(bannerMerged?.ctaLink2 || '/products')}
                    >
                      <CtaIcon name={bannerMerged?.ctaIcon2 || 'calendar'} size={18} />{' '}
                      {bannerMerged?.ctaText2 || t('home.defaultCtaSecondary')}
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
                  fetchpriority="high"
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
                    <span>{bannerMerged?.badgeText || t('home.defaultBadge')}</span>
                  </motion.div>
                )}
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ══════════════ PROMO BANNERS ══════════════ */}
      {promos.length > 0 && (
        <section className="promos-section">
          <Container>
            <div className="promos-grid" style={{ '--promo-count': Math.min(promos.length, 4) }}>
              {promos.slice(0, 4).map((promo, i) => (
                <motion.div
                  key={promo.id || i}
                  className="promo-card"
                  style={{ background: promo.bgColor || '#111', color: promo.textColor || '#fff' }}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  custom={i}
                  viewport={{ once: true }}
                  onClick={() => {
                    const dest = promo.categoryId
                      ? `/products?category=${promo.categoryId}`
                      : (promo.link || '/products');
                    navigate(dest);
                  }}
                >
                  {promo.imageUrl && (
                    <img
                      src={resolveMediaUrl(promo.imageUrl) || promo.imageUrl}
                      alt=""
                      className="promo-card-img"
                    />
                  )}
                  <div className="promo-card-body">
                    {(promo.discountPercent || promo.code) && (
                      <div className="promo-card-code">
                        {promo.discountPercent && (
                          <><FiTag size={11} /><span>SALE {promo.discountPercent}%</span></>
                        )}
                        {promo.code && !promo.discountPercent && (
                          <><FiTag size={11} /><span>{promo.code}</span></>
                        )}
                      </div>
                    )}
                    <div className="promo-card-title">{promo.title}</div>
                    {promo.subtitle && (
                      <div className="promo-card-subtitle">{promo.subtitle}</div>
                    )}
                  </div>
                  {promo.linkText && (
                    <div
                      className="promo-card-cta"
                      style={{ borderColor: promo.textColor, color: promo.textColor }}
                    >
                      {promo.linkText}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ══════════════ CATEGORIES ══════════════ */}
      {displayCategories.length > 0 && (
        <section className="categories-section section-py">
          <Container>
            <div className="section-header">
              <div>
                <span className="section-eyebrow">{t('home.categoriesEyebrow')}</span>
                <h2 className="section-title">{t('home.categoriesTitle')}</h2>
              </div>
              <button className="see-all-btn" onClick={() => navigate('/products')}>
                {t('home.seeAll')} <FiArrowRight size={15} />
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
              <span className="section-eyebrow">{t('home.featuredEyebrow')}</span>
              <h2 className="section-title">{t('home.featuredTitle')}</h2>
              <p className="text-muted small mb-0 mt-1">
                {t('home.featuredHint')}
              </p>
            </div>
            <button className="see-all-btn" onClick={() => navigate('/products')}>
              {t('home.seeAll')} <FiArrowRight size={15} />
            </button>
          </div>

          {isLoading ? (
            <Loading />
          ) : displayFeatured.length === 0 ? (
            <div className="empty-state">
              <p>{t('home.featuredEmpty')}</p>
              <Button className="btn-primary" onClick={() => navigate('/products')}>{t('home.featuredEmptyCta')}</Button>
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
                    <ProductCard
                      product={product}
                      showHotBadge
                      promoDiscount={getDiscountForCategory(activePromotions, product.categoryId?._id ?? product.categoryId)}
                    />
                  </motion.div>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* ══════════════ PRODUCTS BY CATEGORY ══════════════ */}
      {displayCategories.map((cat, index) => {
        const id = String(cat.categoryId || cat._id || cat.id || '');
        const products = catProducts[id];
        if (!products || products.length === 0) return null;
        return (
          <section
            key={id}
            className={`cat-products-section section-py ${index % 2 === 0 ? 'cat-bg-even' : 'cat-bg-odd'}`}
          >
            <Container>
              <div className="section-header">
                <div className="cat-products-header-left">
                  {cat.imageUrl && (
                    <img
                      src={resolveMediaUrl(cat.imageUrl) || PLACEHOLDER}
                      alt=""
                      className="cat-products-icon"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <span className="section-eyebrow">{cat.categoryName}</span>
                    <h2 className="section-title cat-products-title">{cat.categoryName}</h2>
                  </div>
                </div>
                <button
                  className="see-all-btn"
                  onClick={() => navigate(`/products?category=${id}`)}
                >
                  {t('home.seeAll')} <FiArrowRight size={15} />
                </button>
              </div>
              <Row className="g-4">
                {products.map((product, i) => (
                  <Col xl={3} lg={3} md={6} xs={6} key={product._id || product.id}>
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="show"
                      custom={i}
                      viewport={{ once: true }}
                      style={{ height: '100%' }}
                    >
                      <ProductCard
                        product={product}
                        promoDiscount={getDiscountForCategory(activePromotions, product.categoryId?._id ?? product.categoryId)}
                      />
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </Container>
          </section>
        );
      })}

      {/* ══════════════ COURTS ══════════════ */}
      {displayCourts.length > 0 && (
        <section className="courts-section section-py">
          <Container>
            <div className="section-header">
              <div>
                <span className="section-eyebrow">{t('home.courtsEyebrow')}</span>
                <h2 className="section-title">{t('home.courtsTitle')}</h2>
              </div>
              <button className="see-all-btn" onClick={() => navigate('/courts')}>
                {t('home.seeAll')} <FiArrowRight size={15} />
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
                          <span className="court-price-unit">{t('home.courtPerHour')}</span>
                        </div>
                        <button className="court-book-btn">
                          <FiCalendar size={14} /> {t('home.bookNow')}
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

      <SiteReviewsSection />

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
              <h2>{t('home.ctaTitle')}</h2>
              <p>{t('home.ctaSubtitle')}</p>
              <div className="cta-actions">
                <Button className="btn-primary" onClick={() => navigate('/register')}>
                  {t('home.ctaRegister')}
                </Button>
                <Button className="btn-ghost" onClick={() => navigate('/products')}>
                  {t('home.ctaExplore')}
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
