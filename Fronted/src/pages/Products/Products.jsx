import { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Badge } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, setFilters, clearFilters } from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import ProductCard from '../../components/ProductCard/ProductCard';
import Loading from '../../components/Loading/Loading';
import './Products.css';

const Products = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, isLoading, filters, pagination } = useSelector((state) => state.products);
  const { categories, brands } = useSelector((state) => state.categories);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const page = searchParams.get('page') || 1;

    const newFilters = {
      ...(category && { category }),
      ...(brand && { brand }),
      ...(search && { search }),
      ...(minPrice && { minPrice: parseInt(minPrice) }),
      ...(maxPrice && { maxPrice: parseInt(maxPrice) }),
    };

    dispatch(setFilters(newFilters));
    dispatch(fetchProducts({ ...newFilters, page, limit: 12 }));
  }, [searchParams, dispatch]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
    dispatch(clearFilters());
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
  };

  return (
    <Container className="py-5">
      <Row>
        <Col lg={3} className="mb-4">
          <Card className="sticky-top" style={{ top: '100px' }}>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{t('products.filter')}</h5>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="d-lg-none"
              >
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </Card.Header>
            <Card.Body className={showFilters ? 'd-block' : 'd-none d-lg-block'}>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>{t('products.category')}</Form.Label>
                  <Form.Select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('products.brand')}</Form.Label>
                  <Form.Select
                    value={filters.brand || ''}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                  >
                    <option value="">All Brands</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.brandName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('products.price')}</Form.Label>
                  <Row>
                    <Col>
                      <Form.Control
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ''}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Form.Control
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ''}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      />
                    </Col>
                  </Row>
                </Form.Group>

                <Button variant="outline-secondary" onClick={handleClearFilters} className="w-100">
                  Clear Filters
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="d-flex justify-content-between align-items-center mb-4"
          >
            <h2 className="fw-bold gradient-text" style={{ fontSize: '2rem' }}>
              {t('products.title')}
            </h2>
            <Form.Select
              style={{ width: 'auto' }}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="border-primary"
            >
              <option value="">{t('products.sort')}</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </Form.Select>
          </motion.div>

          {isLoading ? (
            <Loading />
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-5"
            >
              <p className="text-muted fs-4">{t('common.noResults')}</p>
            </motion.div>
          ) : (
            <>
              <Row>
                {products.map((product, index) => (
                  <Col md={4} key={product.id} className="mb-4">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  </Col>
                ))}
              </Row>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center gap-2 mt-4">
                  <Button
                    variant="outline-dark"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    {t('common.previous')}
                  </Button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={pagination.page === i + 1 ? 'dark' : 'outline-dark'}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline-dark"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Products;
