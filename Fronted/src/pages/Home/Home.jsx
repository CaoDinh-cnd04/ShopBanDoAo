import { useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchCourts } from '../../store/slices/courtSlice';
import ProductCard from '../../components/ProductCard/ProductCard';
import Loading from '../../components/Loading/Loading';
import './Home.css';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { products, isLoading } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const { courts } = useSelector((state) => state.courts);

  useEffect(() => {
    // Fetch featured products
    dispatch(fetchProducts({ isFeatured: 1, limit: 8 }));
    dispatch(fetchCategories());
    dispatch(fetchCourts({ limit: 3 }));
  }, [dispatch]);

  const featuredProducts = products.slice(0, 8);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center min-vh-50">
            <Col lg={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="display-1 fw-bold mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 4px 20px rgba(255, 255, 255, 0.3)',
                  }}
                >
                  {t('home.hero.title')}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="lead mb-4 text-white"
                  style={{ fontSize: '1.3rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                >
                  {t('home.hero.subtitle')}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="px-5 py-3"
                    onClick={() => navigate('/products')}
                  >
                    {t('home.hero.cta')}
                  </Button>
                </motion.div>
              </motion.div>
            </Col>
            <Col lg={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="hero-image">
                  <img
                    src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800"
                    alt="Hero"
                    className="img-fluid rounded"
                  />
                </div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Categories Section */}
      <section className="categories-section py-5">
        <Container>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-5 fw-bold gradient-text"
            style={{ fontSize: '2.5rem' }}
          >
            {t('home.categories')}
          </motion.h2>
          {categories.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">
                {t('common.noCategories') || 'Chưa có danh mục'}
              </p>
            </div>
          ) : (
            <Row>
              {categories.slice(0, 4).map((category, index) => (
                <Col md={3} key={`category-${category.id || index}`} className="mb-4">
                <motion.div
                  key={`category-motion-${category.id || index}`}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="category-card text-center p-4 rounded"
                  onClick={() => navigate(`/products?category=${category.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="category-icon mb-3">
                    <img
                      src={category.imageUrl || '/placeholder.jpg'}
                      alt={category.categoryName}
                      className="img-fluid"
                      style={{ height: '100px', objectFit: 'contain' }}
                    />
                  </div>
                  <h5 className="fw-bold">{category.categoryName}</h5>
                </motion.div>
              </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Featured Products */}
      <section className="featured-section py-5 bg-light">
        <Container>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="d-flex justify-content-between align-items-center mb-5"
          >
            <h2 className="fw-bold gradient-text" style={{ fontSize: '2.5rem' }}>
              {t('home.featured')}
            </h2>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline-primary" onClick={() => navigate('/products')}>
                {t('common.viewAll')}
              </Button>
            </motion.div>
          </motion.div>
          {isLoading ? (
            <Loading />
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted fs-5 mb-3">
                {t('common.noProducts') || 'Chưa có sản phẩm nổi bật'}
              </p>
              <Button variant="outline-primary" onClick={() => navigate('/products')}>
                {t('common.viewAll') || 'Xem tất cả sản phẩm'}
              </Button>
            </div>
          ) : (
            <Row>
              {featuredProducts.map((product, index) => (
                <Col md={3} key={product.id} className="mb-4">
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -10 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Courts Promo Section */}
      <section className="courts-section py-5">
        <Container>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-5 fw-bold gradient-text"
            style={{ fontSize: '2.5rem' }}
          >
            {t('home.courts')}
          </motion.h2>
          {courts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-4">
                {t('common.noCourts') || 'Chưa có sân bóng'}
              </p>
              <Button variant="outline-primary" onClick={() => navigate('/courts')}>
                {t('common.viewAll') || 'Xem tất cả sân bóng'}
              </Button>
            </div>
          ) : (
            <Row>
              {courts.slice(0, 3).map((court, index) => (
                <Col md={4} key={court.id} className="mb-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="court-card card h-100"
                  onClick={() => navigate(`/courts/${court.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <motion.img
                    src={court.imageUrl || '/placeholder.jpg'}
                    alt={court.courtName}
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="card-body">
                    <h5 className="card-title fw-bold">{court.courtName}</h5>
                    <p className="card-text text-muted">{court.courtType?.typeName}</p>
                    <p className="fw-bold gradient-text fs-5">
                      {court.pricePerHour?.toLocaleString('vi-VN')} ₫/hour
                    </p>
                  </div>
                </motion.div>
              </Col>
              ))}
            </Row>
          )}
          {courts.length > 0 && (
            <motion.div
              className="text-center mt-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" onClick={() => navigate('/courts')}>
                  {t('common.viewAll')}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </Container>
      </section>
    </div>
  );
};

export default Home;
