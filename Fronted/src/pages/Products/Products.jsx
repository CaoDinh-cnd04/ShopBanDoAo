import { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiFilter,
  FiX,
  FiGrid,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiSliders,
  FiSearch,
} from 'react-icons/fi';
import {
  fetchProducts,
  setFilters,
  clearFilters,
} from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard/ProductCard';
import Loading from '../../components/Loading/Loading';
import './Products.css';

function splitCsv(param) {
  if (!param || typeof param !== 'string') return [];
  return param
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function presetMatches(searchParams, preset) {
  const rawMin = searchParams.get('minPrice');
  const rawMax = searchParams.get('maxPrice');
  const wantMin = preset.min != null ? String(preset.min) : '';
  const wantMax = preset.max != null ? String(preset.max) : '';
  return (rawMin || '') === wantMin && (rawMax || '') === wantMax;
}

/** Đồng bộ query URL → params GET /products (tránh lệch ref searchParams). */
function buildProductListParams(searchParams) {
  const categoriesCsv = searchParams.get('categories');
  const categorySingle = searchParams.get('category');
  return {
    page: searchParams.get('page') || '1',
    limit: '12',
    search: searchParams.get('search') || undefined,
    sort: searchParams.get('sort') || undefined,
    categories: categoriesCsv || undefined,
    category:
      !categoriesCsv && categorySingle ? categorySingle : undefined,
    brands: searchParams.get('brands') || undefined,
    brand:
      !searchParams.get('brands') && searchParams.get('brand')
        ? searchParams.get('brand')
        : undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
  };
}

function categoryIdFrom(cat) {
  const raw = cat._id ?? cat.id ?? cat.categoryId;
  if (raw == null) return '';
  if (typeof raw === 'object' && raw !== null) {
    if (typeof raw.toHexString === 'function') return raw.toHexString();
    if (raw.$oid && typeof raw.$oid === 'string') return raw.$oid;
    return String(raw);
  }
  return String(raw).trim();
}

/** Extracted outside Products so React doesn't remount it on every render */
const FilterSidebar = ({
  t,
  hasFilters,
  handleClear,
  searchDraft,
  setSearchDraft,
  safeCategories,
  selectedCats,
  toggleCategory,
  brandOptions,
  selectedBrands,
  toggleBrand,
  pricePresets,
  searchParams,
  togglePricePreset,
  minPriceDraft,
  maxPriceDraft,
  setMinPriceDraft,
  setMaxPriceDraft,
  applyCustomPrice,
}) => (
  <div className="filter-sidebar">
    <div className="filter-header">
      <span className="filter-title">
        <FiSliders size={16} /> {t('products.filterTitle')}
      </span>
      {hasFilters && (
        <button type="button" className="clear-btn" onClick={handleClear}>
          <FiX size={14} /> {t('products.clear')}
        </button>
      )}
    </div>

    <div className="filter-group filter-group-first">
      <p className="filter-group-label">{t('products.searchByName')}</p>
      <div className="filter-search-wrap">
        <FiSearch className="filter-search-icon" size={16} aria-hidden />
        <input
          type="search"
          className="filter-search-input"
          placeholder={t('products.searchPlaceholder')}
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          autoComplete="off"
        />
      </div>
    </div>

    <div className="filter-group">
      <p className="filter-group-label">{t('products.categoriesMulti')}</p>
      <div className="filter-checklist">
        {safeCategories.map((cat) => {
          const id = categoryIdFrom(cat);
          if (!id) return null;
          const checked = selectedCats.includes(id);
          return (
            <label key={id} className="filter-check-row">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleCategory(id)}
              />
              <span>{cat.categoryName}</span>
            </label>
          );
        })}
      </div>
    </div>

    <div className="filter-group">
      <p className="filter-group-label">{t('products.brandsMulti')}</p>
      {brandOptions.length === 0 ? (
        <p className="filter-empty-hint">{t('products.brandsLoading')}</p>
      ) : (
        <div className="filter-checklist filter-checklist-scroll">
          {brandOptions.map((b) => (
            <label key={b} className="filter-check-row">
              <input
                type="checkbox"
                checked={selectedBrands.includes(b)}
                onChange={() => toggleBrand(b)}
              />
              <span>{b}</span>
            </label>
          ))}
        </div>
      )}
    </div>

    <div className="filter-group">
      <p className="filter-group-label">{t('products.priceRange')}</p>
      <div className="filter-price-presets">
        {pricePresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={`filter-opt ${presetMatches(searchParams, preset) ? 'active' : ''}`}
            onClick={() => togglePricePreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="filter-price-custom">
        <div className="filter-price-fields">
          <label className="filter-price-field">
            <span>{t('products.priceFrom')}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={t('products.priceMinPh')}
              value={minPriceDraft}
              onChange={(e) => setMinPriceDraft(e.target.value)}
            />
          </label>
          <label className="filter-price-field">
            <span>{t('products.priceTo')}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={t('products.priceMaxPh')}
              value={maxPriceDraft}
              onChange={(e) => setMaxPriceDraft(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className="filter-apply-price-btn"
          onClick={applyCustomPrice}
        >
          {t('products.applyPrice')}
        </button>
      </div>
    </div>
  </div>
);

const Products = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, isLoading, pagination } = useSelector((s) => s.products);
  const { categories } = useSelector((s) => s.categories);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [brandOptions, setBrandOptions] = useState([]);

  const sortOptions = useMemo(
    () => [
      { value: '', label: t('products.sortDefault') },
      { value: 'price_asc', label: t('products.sortPriceAsc') },
      { value: 'price_desc', label: t('products.sortPriceDesc') },
      { value: 'name_asc', label: t('products.sortNameAsc') },
      { value: 'newest', label: t('products.sortNewest') },
    ],
    [t],
  );

  const pricePresets = useMemo(
    () => [
      { label: t('products.priceUnder500k'), min: null, max: 500000 },
      { label: t('products.price500to1m'), min: 500000, max: 1000000 },
      { label: t('products.price1to3m'), min: 1000000, max: 3000000 },
      { label: t('products.priceOver3m'), min: 3000000, max: null },
    ],
    [t],
  );

  const urlSearch = searchParams.get('search') || '';
  const [searchDraft, setSearchDraft] = useState(urlSearch);
  const [minPriceDraft, setMinPriceDraft] = useState(
    () => searchParams.get('minPrice') || '',
  );
  const [maxPriceDraft, setMaxPriceDraft] = useState(
    () => searchParams.get('maxPrice') || '',
  );

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/categories/brands').catch(() => ({ data: { data: [] } })),
      api.get('/products/meta/brands').catch(() => ({ data: { data: [] } })),
    ]).then(([catRes, prodRes]) => {
      if (cancelled) return;
      const a = Array.isArray(catRes.data?.data) ? catRes.data.data : [];
      const b = Array.isArray(prodRes.data?.data) ? prodRes.data.data : [];
      const seen = new Set();
      const merged = [];
      for (const x of [...a, ...b]) {
        const s = typeof x === 'string' ? x.trim() : String(x);
        if (!s || seen.has(s)) continue;
        seen.add(s);
        merged.push(s);
      }
      merged.sort((x, y) =>
        x.localeCompare(y, i18n.language?.startsWith('vi') ? 'vi' : 'en'),
      );
      setBrandOptions(merged);
    });
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  useEffect(() => {
    setSearchDraft(urlSearch);
  }, [urlSearch]);

  const minPriceFromUrl = searchParams.get('minPrice') || '';
  const maxPriceFromUrl = searchParams.get('maxPrice') || '';

  useEffect(() => {
    setMinPriceDraft(minPriceFromUrl);
    setMaxPriceDraft(maxPriceFromUrl);
  }, [minPriceFromUrl, maxPriceFromUrl]);

  const setParams = useCallback(
    (updates, { resetPage = true } = {}) => {
      const p = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') p.delete(k);
        else p.set(k, String(v));
      });
      if (resetPage) p.set('page', '1');
      setSearchParams(p);
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        const cur = p.get('search') || '';
        if (searchDraft === cur) return prev;
        if (searchDraft) p.set('search', searchDraft);
        else p.delete('search');
        p.set('page', '1');
        return p;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchDraft, setSearchParams]);

  const queryKey = searchParams.toString();

  useEffect(() => {
    const params = buildProductListParams(searchParams);
    dispatch(setFilters(params));
    dispatch(fetchProducts(params));
    // Chỉ phụ thuộc queryKey (searchParams.toString()) — không phụ thuộc ref searchParams để tránh fetch lặp & race.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParams khớp queryKey khi queryKey đổi
  }, [queryKey, dispatch]);

  const setParam = (key, value) => {
    setParams({ [key]: value ?? '' });
  };

  const handleClear = () => {
    setSearchParams({});
    dispatch(clearFilters());
    setSearchDraft('');
    setMinPriceDraft('');
    setMaxPriceDraft('');
  };

  const goPage = (n) => {
    const p = new URLSearchParams(searchParams);
    p.set('page', String(n));
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCategoryIds = useCallback(() => {
    const csv = searchParams.get('categories');
    if (csv) return splitCsv(csv);
    const one = searchParams.get('category');
    return one ? [one] : [];
  }, [searchParams]);

  const getBrandNames = useCallback(() => {
    const csv = searchParams.get('brands');
    if (csv) return splitCsv(csv);
    const one = searchParams.get('brand');
    return one ? [one] : [];
  }, [searchParams]);

  const toggleCategory = (id) => {
    const sid = String(id);
    const ids = getCategoryIds();
    const next = ids.includes(sid)
      ? ids.filter((x) => x !== sid)
      : [...ids, sid];
    const updates = { category: '', categories: '' };
    if (next.length === 0) {
      setParams(updates);
    } else {
      setParams({ ...updates, categories: next.join(',') });
    }
  };

  const toggleBrand = (name) => {
    const names = getBrandNames();
    const next = names.includes(name)
      ? names.filter((b) => b !== name)
      : [...names, name];
    const updates = { brand: '', brands: '' };
    if (next.length === 0) {
      setParams(updates);
    } else {
      setParams({ ...updates, brands: next.join(',') });
    }
  };

  const applyCustomPrice = () => {
    setParams({
      minPrice: minPriceDraft.trim(),
      maxPrice: maxPriceDraft.trim(),
    });
  };

  const togglePricePreset = (preset) => {
    if (presetMatches(searchParams, preset)) {
      setParams({ minPrice: '', maxPrice: '' });
    } else {
      setParams({
        minPrice: preset.min != null ? String(preset.min) : '',
        maxPrice: preset.max != null ? String(preset.max) : '',
      });
    }
  };

  const currentPage = pagination?.currentPage || Number(searchParams.get('page')) || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || 0;
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const selectedCats = getCategoryIds();
  const selectedBrands = getBrandNames();

  const hasFilters = Boolean(
    searchParams.get('search') ||
      searchParams.get('categories') ||
      searchParams.get('category') ||
      searchParams.get('brands') ||
      searchParams.get('brand') ||
      searchParams.get('minPrice') ||
      searchParams.get('maxPrice'),
  );

  const sidebarProps = {
    t,
    hasFilters,
    handleClear,
    searchDraft,
    setSearchDraft,
    safeCategories,
    selectedCats,
    toggleCategory,
    brandOptions,
    selectedBrands,
    toggleBrand,
    pricePresets,
    searchParams,
    togglePricePreset,
    minPriceDraft,
    maxPriceDraft,
    setMinPriceDraft,
    setMaxPriceDraft,
    applyCustomPrice,
  };

  return (
    <div className="products-page">
      <div className="products-page-header">
        <Container>
          <div className="products-header-inner">
            <div>
              <h1 className="products-page-title">{t('products.pageTitle')}</h1>
              {totalItems > 0 && (
                <span className="products-count">{t('products.count', { count: totalItems })}</span>
              )}
            </div>
            <div className="products-toolbar">
              <button
                type="button"
                className="toolbar-btn mobile-filter-toggle"
                onClick={() => setSidebarOpen(true)}
              >
                <FiFilter size={16} /> {t('products.mobileFilter')}
              </button>

              <select
                className="sort-select"
                value={searchParams.get('sort') || ''}
                onChange={(e) => setParam('sort', e.target.value)}
              >
                {sortOptions.map((o) => (
                  <option key={o.value || 'default'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <div className="view-toggle">
                <button
                  type="button"
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <FiGrid size={16} />
                </button>
                <button
                  type="button"
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <FiList size={16} />
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="products-layout">
        <Row className="g-4">
          <Col lg={3} className="d-none d-lg-block">
            <div className="sidebar-sticky">
              <FilterSidebar {...sidebarProps} />
            </div>
          </Col>

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
                <h3>{t('products.noResultsTitle')}</h3>
                <p>{t('products.noResultsHint')}</p>
                <button type="button" className="btn-primary" onClick={handleClear}>
                  {t('products.clearFilters')}
                </button>
              </motion.div>
            ) : (
              <>
                <Row
                  className={`g-3 ${viewMode === 'list' ? 'products-list-view' : ''}`}
                >
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

                {totalPages > 1 && (
                  <div className="pagination-bar">
                    <button
                      type="button"
                      className="page-btn"
                      onClick={() => goPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <FiChevronLeft size={16} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      if (
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1
                      ) {
                        return (
                          <button
                            key={p}
                            type="button"
                            className={`page-btn ${p === currentPage ? 'active' : ''}`}
                            onClick={() => goPage(p)}
                          >
                            {p}
                          </button>
                        );
                      }
                      if (Math.abs(p - currentPage) === 2) {
                        return (
                          <span key={p} className="page-ellipsis">
                            …
                          </span>
                        );
                      }
                      return null;
                    })}
                    <button
                      type="button"
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

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="drawer-header">
                <span>{t('products.drawerFilter')}</span>
                <button type="button" onClick={() => setSidebarOpen(false)}>
                  <FiX size={20} />
                </button>
              </div>
              <div className="drawer-content">
                <FilterSidebar {...sidebarProps} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
