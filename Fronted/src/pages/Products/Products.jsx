import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { FiFilter, FiX, FiGrid, FiList, FiChevronLeft, FiChevronRight, FiSliders } from 'react-icons/fi';
import { fetchProducts, setFilters, clearFilters } from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import ProductCard from '../../components/ProductCard/ProductCard';
import Loading from '../../components/Loading/Loading';
import './Products.css';

const SORT_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
  { value: 'name_asc', label: 'Tên: A → Z' },
  { value: 'newest', label: 'Mới nhất' },
];

const Products = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, isLoading, filters, pagination } = useSelector((s) => s.products);
  const { categories } = useSelector((s) => s.categories);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  useEffect(() => {
    const params = {
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      limit: 12,
    };
    dispatch(setFilters(params));
    dispatch(fetchProducts(params));
  }, [searchParams, dispatch]);

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    value ? p.set(key, value) : p.delete(key);
    p.set('page', '1');
    setSearchParams(p);
  };

  const handleClear = () => { setSearchParams({}); dispatch(clearFilters()); };

  const goPage = (n) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', n);
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentPage = pagination?.currentPage || Number(searchParams.get('page')) || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || 0;
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const hasFilters = !!(searchParams.get('category') || searchParams.get('search'));

  const Sidebar = () => (
    <div className="filter-sidebar">
      <div className="filter-header">
        <span className="filter-title"><FiSliders size={16} /> Bộ lọc</span>
        {hasFilters && (
          <button className="clear-btn" onClick={handleClear}>
            <FiX size={14} /> Xoá
          </button>
        )}
      </div>

      {/* Category */}
      <div className="filter-group">
        <p className="filter-group-label">Danh mục</p>
        <div className="filter-options">
          <button
            className={`filter-opt ${!searchParams.get('category') ? 'active' : ''}`}
            onClick={() => setParam('category', '')}
          >Tất cả</button>
          {safeCategories.map((cat) => {
            const id = cat._id || cat.id || cat.categoryId;
            return (
              <button
                key={id}
                className={`filter-opt ${searchParams.get('category') === String(id) ? 'active' : ''}`}
                onClick={() => setParam('category', id)}
              >
                {cat.categoryName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="filter-group">
        <p className="filter-group-label">Khoảng giá</p>
        <div className="price-presets">
          {[
            { label: 'Dưới 500K', max: 500000 },
            { label: '500K – 1M', min: 500000, max: 1000000 },
            { label: '1M – 3M', min: 1000000, max: 3000000 },
            { label: 'Trên 3M', min: 3000000 },
          ].map(({ label, min, max }) => (
            <button
              key={label}
              className="filter-opt"
              onClick={() => {
                setParam('minPrice', min || '');
                setParam('maxPrice', max || '');
              }}
            >{label}</button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="products-page">
      {/* Page header */}
      <div className="products-page-header">
        <Container>
          <div className="products-header-inner">
            <div>
              <h1 className="products-page-title">Sản phẩm</h1>
              {totalItems > 0 && (
                <span className="products-count">{totalItems} sản phẩm</span>
              )}
            </div>
            <div className="products-toolbar">
              {/* Mobile filter toggle */}
              <button className="toolbar-btn mobile-filter-toggle" onClick={() => setSidebarOpen(true)}>
                <FiFilter size={16} /> Lọc
              </button>

              {/* Sort */}
              <select
                className="sort-select"
                value={searchParams.get('sort') || ''}
                onChange={(e) => setParam('sort', e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* View mode */}
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                ><FiGrid size={16} /></button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                ><FiList size={16} /></button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="products-layout">
        <Row className="g-4">
          {/* Sidebar — desktop */}
          <Col lg={3} className="d-none d-lg-block">
            <div className="sidebar-sticky">
              <Sidebar />
            </div>
          </Col>

          {/* Products grid */}
          <Col lg={9}>
            {isLoading ? (
              <Loading />
            ) : safeProducts.length === 0 ? (
              <motion.div
                className="no-products"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="no-products-icon">🔍</div>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Thử điều chỉnh bộ lọc hoặc từ khoá tìm kiếm</p>
                <button className="btn-primary" onClick={handleClear}>Xoá bộ lọc</button>
              </motion.div>
            ) : (
              <>
                <Row className={`g-3 ${viewMode === 'list' ? 'products-list-view' : ''}`}>
                  {safeProducts.map((product, i) => (
                    <Col
                      key={product._id || product.id}
                      xl={viewMode === 'list' ? 12 : 4}
                      md={viewMode === 'list' ? 12 : 6}
                      xs={viewMode === 'list' ? 12 : 6}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (i % 12) * 0.04 }}
                        style={{ height: '100%' }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    </Col>
                  ))}
                </Row>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination-bar">
                    <button
                      className="page-btn"
                      onClick={() => goPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <FiChevronLeft size={16} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
                        return (
                          <button
                            key={p}
                            className={`page-btn ${p === currentPage ? 'active' : ''}`}
                            onClick={() => goPage(p)}
                          >{p}</button>
                        );
                      }
                      if (Math.abs(p - currentPage) === 2) return <span key={p} className="page-ellipsis">…</span>;
                      return null;
                    })}
                    <button
                      className="page-btn"
                      onClick={() => goPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="sidebar-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="sidebar-drawer"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="drawer-header">
                <span>Bộ lọc</span>
                <button onClick={() => setSidebarOpen(false)}><FiX size={20} /></button>
              </div>
              <div className="drawer-content">
                <Sidebar />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
