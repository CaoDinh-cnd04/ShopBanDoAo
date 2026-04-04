import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiShoppingCart,
  FiHeart,
  FiStar,
  FiZoomIn,
  FiTruck,
  FiShield,
  FiRefreshCw,
  FiMinus,
  FiPlus,
  FiChevronRight,
  FiChevronLeft,
  FiPackage,
  FiLayers,
  FiMapPin,
  FiActivity,
  FiX,
  FiShoppingBag,
} from 'react-icons/fi';
import { fetchProductById } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import { fetchProductReviews } from '../../store/slices/reviewSlice';
import ReviewForm from '../../components/Reviews/ReviewForm';
import ReviewList from '../../components/Reviews/ReviewList';
import ProductCard from '../../components/ProductCard/ProductCard';
import Loading from '../../components/Loading/Loading';
import { toast } from 'react-toastify';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { hexFromColorName } from '../../utils/productVariantUtils';
import api from '../../services/api';
import './ProductDetail.css';

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const PERKS = [
  { icon: FiTruck, label: 'Miễn phí vận chuyển\ncho đơn trên 500K' },
  { icon: FiShield, label: 'Bảo hành chính hãng\n12 tháng' },
  { icon: FiRefreshCw, label: 'Đổi trả miễn phí\ntrong 30 ngày' },
];

function normColor(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getVariantSize(v) {
  if (!v) return '';
  const a = v.attributes || {};
  return String(
    v.size ?? a.size ?? a.Size ?? a.shoeSize ?? a.spec ?? a.type ?? '',
  ).trim();
}

function getVariantColor(v) {
  if (!v) return '';
  const a = v.attributes || {};
  return String(v.color ?? a.color ?? a.Color ?? '').trim();
}

function swatchHex(v) {
  const c = getVariantColor(v);
  const derived = hexFromColorName(c);
  return derived ?? v?.colorHex ?? '#94a3b8';
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { product, isLoading } = useSelector((s) => s.products);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { items: wishlistItems } = useSelector((s) => s.wishlist);
  const { productReviews } = useSelector((s) => s.reviews);

  const [selSize, setSelSize] = useState('');
  const [selColor, setSelColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState('desc');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    dispatch(fetchProductById(id));
    dispatch(fetchProductReviews(id));
    setActiveImg(0);
    setQuantity(1);
    setSelSize('');
    setSelColor('');
  }, [id, dispatch]);

  // Fetch related products when product (and its categoryId) is available
  useEffect(() => {
    if (!product) return;
    const catRaw = product.categoryId;
    const catId = catRaw && typeof catRaw === 'object'
      ? String(catRaw._id || catRaw.id || '')
      : String(catRaw || '');
    if (!catId) return;

    let cancelled = false;
    api
      .get('/products', { params: { category: catId, limit: 9, page: 1 } })
      .then((res) => {
        if (cancelled) return;
        // API trả về { products: [...], pagination: {...} }
        const list = Array.isArray(res.data?.products)
          ? res.data.products
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        const currentId = String(product._id || product.id || '');
        const filtered = list
          .filter((p) => String(p._id || p.id || '') !== currentId)
          .slice(0, 8);
        setRelatedProducts(filtered);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  const variants = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : []),
    [product],
  );

  const hasSize = useMemo(() => variants.some((v) => getVariantSize(v)), [variants]);
  const hasColor = useMemo(() => variants.some((v) => getVariantColor(v)), [variants]);

  const sizes = useMemo(() => {
    const s = new Set(variants.map((v) => getVariantSize(v)).filter(Boolean));
    return [...s];
  }, [variants]);

  const colorsForSelection = useMemo(() => {
    let list = variants;
    if (hasSize && selSize) list = list.filter((v) => getVariantSize(v) === selSize);
    const c = new Set(list.map((v) => getVariantColor(v)).filter(Boolean));
    return [...c];
  }, [variants, hasSize, selSize]);

  useEffect(() => {
    if (!product) return;
    const vars = product.variants || [];
    if (!vars.length) {
      setSelSize('');
      setSelColor('');
      return;
    }
    const v0 = vars[0];
    if (vars.some((x) => getVariantSize(x))) setSelSize(getVariantSize(v0));
    if (vars.some((x) => getVariantColor(x))) setSelColor(getVariantColor(v0));
  }, [product, id]);

  useEffect(() => {
    if (!hasColor || !variants.length) return;
    const ok = variants.some(
      (v) =>
        (!selSize || getVariantSize(v) === selSize) && getVariantColor(v) === selColor,
    );
    if (!ok && colorsForSelection.length) {
      setSelColor(colorsForSelection[0]);
    }
  }, [selSize, variants, hasColor, selColor, colorsForSelection]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;
    return (
      variants.find(
        (v) =>
          (!hasSize || getVariantSize(v) === selSize) &&
          (!hasColor || getVariantColor(v) === selColor),
      ) || variants[0]
    );
  }, [variants, hasSize, hasColor, selSize, selColor]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?._id]);

  const rawImageRows = useMemo(() => {
    const raw = Array.isArray(product?.images) ? product.images : [];
    return raw.map((img) => {
      const url = resolveMediaUrl(typeof img === 'string' ? img : img?.imageUrl);
      const color =
        typeof img === 'object' && img?.color != null ? String(img.color).trim() : '';
      return { url, color };
    }).filter((r) => r.url);
  }, [product?.images]);

  const galleryImages = useMemo(() => {
    if (!rawImageRows.length) return [resolveMediaUrl('/placeholder.svg')];
    const anyTagged = rawImageRows.some((r) => r.color);
    if (!anyTagged || !hasColor || !selColor) {
      return rawImageRows.map((r) => r.url);
    }
    const nc = normColor(selColor);
    const filtered = rawImageRows.filter(
      (r) => !r.color || normColor(r.color) === nc,
    );
    return filtered.length ? filtered.map((r) => r.url) : rawImageRows.map((r) => r.url);
  }, [rawImageRows, hasColor, selColor]);

  useEffect(() => {
    setActiveImg(0);
  }, [selColor, galleryImages.length]);

  const goPrev = useCallback(() => {
    setActiveImg((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setActiveImg((i) => Math.min(galleryImages.length - 1, i + 1));
  }, [galleryImages.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (lightboxOpen) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, lightboxOpen]);

  useEffect(() => {
    if (lightboxOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  if (isLoading) return <Loading />;
  if (!product) {
    return (
      <div className="pd-not-found">
        <p>Sản phẩm không tồn tại</p>
        <button type="button" onClick={() => navigate('/products')} className="pd-back-btn">
          ← Quay lại
        </button>
      </div>
    );
  }

  const pid = product._id || product.id;
  const cat = product.categoryId;
  const categoryName =
    typeof cat === 'object' && cat?.categoryName ? cat.categoryName : '';
  const categorySlug =
    typeof cat === 'object' && cat?.categorySlug ? cat.categorySlug : '';

  const isInWishlist = wishlistItems?.some((i) => {
    const p = i.productId && typeof i.productId === 'object' ? i.productId._id : i.productId;
    return p?.toString() === String(pid);
  });

  const priceNoVariant = Number(product.defaultPrice) || 0;
  const displayPrice = variants.length
    ? Number(selectedVariant?.price) || priceNoVariant
    : priceNoVariant;
  const displayOriginal = Number(product.originalPrice) || 0;

  const stock = variants.length
    ? Number(selectedVariant?.stockQuantity) || 0
    : Number(product.stockQuantity) || 0;

  const isOutOfStock = stock <= 0;
  const rating = product.rating || product.averageRating;

  const longDesc =
    product.longDescription || product.description || product.shortDescription || '';
  const variantIdForCart = selectedVariant?._id?.toString();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập');
      navigate('/login');
      return;
    }
    if (!pid) {
      toast.error('Không tìm thấy sản phẩm');
      return;
    }
    if (variants.length && !variantIdForCart) {
      toast.error('Vui lòng chọn size / màu');
      return;
    }
    dispatch(
      addToCart({
        productId: pid.toString(),
        quantity,
        variantId: variants.length ? variantIdForCart : undefined,
      }),
    );
    toast.success('Đã thêm vào giỏ hàng');
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập');
      navigate('/login');
      return;
    }
    if (!pid) {
      toast.error('Không tìm thấy sản phẩm');
      return;
    }
    if (variants.length && !variantIdForCart) {
      toast.error('Vui lòng chọn size / màu');
      return;
    }
    dispatch(
      addToCart({
        productId: pid.toString(),
        quantity,
        variantId: variants.length ? variantIdForCart : undefined,
      }),
    );
    toast.success('Đã thêm vào giỏ hàng');
    navigate('/cart');
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập');
      navigate('/login');
      return;
    }
    dispatch(toggleWishlist(pid.toString()));
    toast.success(isInWishlist ? 'Đã xoá khỏi yêu thích' : 'Đã thêm vào yêu thích');
  };

  const mainSrc = galleryImages[activeImg] || galleryImages[0];

  return (
    <div className="pd-page">
      <Container fluid="lg" className="pd-container">
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Trang chủ</Link>
          <FiChevronRight size={14} aria-hidden />
          <Link to="/products">Sản phẩm</Link>
          {categoryName && (
            <>
              <FiChevronRight size={14} aria-hidden />
              <Link to={categorySlug ? `/products?category=${categorySlug}` : '/products'}>
                {categoryName}
              </Link>
            </>
          )}
          <FiChevronRight size={14} aria-hidden />
          <span className="pd-bc-current">{product.productName}</span>
        </nav>

        <Row className="pd-main-row g-4 g-xl-5">
          <Col lg={7} xl={7}>
            <motion.div
              className="pd-gallery"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="pd-gallery-thumbs" role="tablist" aria-label="Ảnh sản phẩm">
                {galleryImages.map((src, i) => (
                  <button
                    key={`${i}-${src.slice(0, 48)}`}
                    type="button"
                    role="tab"
                    aria-selected={i === activeImg}
                    className={`pd-gallery-thumb ${i === activeImg ? 'is-active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>

              <div className="pd-gallery-stage-wrap">
                <div className="pd-gallery-stage">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${mainSrc}-${activeImg}`}
                      src={mainSrc}
                      alt={product.productName}
                      className="pd-gallery-main-img"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </AnimatePresence>

                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="pd-gallery-nav pd-gallery-nav--prev"
                        aria-label="Ảnh trước"
                        onClick={goPrev}
                        disabled={activeImg <= 0}
                      >
                        <FiChevronLeft size={28} />
                      </button>
                      <button
                        type="button"
                        className="pd-gallery-nav pd-gallery-nav--next"
                        aria-label="Ảnh sau"
                        onClick={goNext}
                        disabled={activeImg >= galleryImages.length - 1}
                      >
                        <FiChevronRight size={28} />
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    className="pd-gallery-zoom"
                    aria-label="Phóng to ảnh"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <FiZoomIn size={20} />
                  </button>

                  {isOutOfStock && <div className="pd-oos-overlay">Hết hàng</div>}
                </div>
                <p className="pd-gallery-hint d-none d-md-block">
                  Dùng phím ← → để xem ảnh
                </p>
              </div>
            </motion.div>
          </Col>

          <Col lg={5} xl={5}>
            <motion.div
              className="pd-buy"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              {product.brand && (
                <span className="pd-brand">
                  {typeof product.brand === 'string' ? product.brand : product.brand?.brandName}
                </span>
              )}
              <h1 className="pd-name">{product.productName}</h1>

              <div className="pd-meta-row">
                {product.sku && (
                  <span className="pd-meta">
                    <FiPackage size={13} aria-hidden /> SKU: {product.sku}
                  </span>
                )}
                {categoryName && (
                  <span className="pd-meta">
                    <FiLayers size={13} aria-hidden /> {categoryName}
                  </span>
                )}
              </div>

              <div className="pd-sales-stats" aria-label="Thống kê bán hàng">
                <span className="pd-sales-stat">
                  <FiShoppingBag size={14} aria-hidden />
                  Đã bán:{' '}
                  <strong>{Number(product.totalSold ?? 0).toLocaleString('vi-VN')}</strong>
                </span>
                <span className="pd-sales-stat">
                  <FiShoppingCart size={14} aria-hidden />
                  Đơn đặt:{' '}
                  <strong>{Number(product.orderCount ?? 0).toLocaleString('vi-VN')}</strong>
                </span>
              </div>

              {rating != null && Number(rating) > 0 && (
                <div className="pd-rating">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FiStar
                      key={s}
                      size={14}
                      fill={s <= Math.round(rating) ? '#F59E0B' : 'none'}
                      color={s <= Math.round(rating) ? '#F59E0B' : '#CBD5E1'}
                    />
                  ))}
                  <span className="pd-rating-text">{Number(rating).toFixed(1)}</span>
                  {product.reviewCount > 0 && (
                    <span className="pd-review-count">({product.reviewCount} đánh giá)</span>
                  )}
                </div>
              )}

              <div className="pd-price-block">
                <div className="pd-price-row">
                  <span className="pd-price">{fmt(displayPrice)}</span>
                  {displayOriginal > displayPrice && (
                    <span className="pd-price-old">{fmt(displayOriginal)}</span>
                  )}
                </div>
                {!isOutOfStock && <span className="pd-in-stock">Còn {stock} sản phẩm</span>}
              </div>

              {(product.material || product.origin || product.weight != null) && (
                <div className="pd-specs-mini">
                  {product.material && (
                    <span>
                      <FiActivity size={13} aria-hidden /> Chất liệu: {product.material}
                    </span>
                  )}
                  {product.origin && (
                    <span>
                      <FiMapPin size={13} aria-hidden /> Xuất xứ: {product.origin}
                    </span>
                  )}
                  {product.weight != null && product.weight !== '' && (
                    <span>
                      <FiPackage size={13} aria-hidden /> Trọng lượng: {product.weight} kg
                    </span>
                  )}
                </div>
              )}

              {hasSize && (
                <div className="pd-block">
                  <div className="pd-block-head">
                    <span className="pd-block-title">Chọn size</span>
                    {selSize && (
                      <span className="pd-block-selected">
                        Đã chọn: <strong>{selSize}</strong>
                      </span>
                    )}
                  </div>
                  <div className="pd-size-grid" role="listbox" aria-label="Size">
                    {sizes.map((size) => {
                      const v = variants.find((x) => getVariantSize(x) === size);
                      const disabled = !v || (v.stockQuantity ?? 0) <= 0;
                      return (
                        <button
                          key={size}
                          type="button"
                          role="option"
                          aria-selected={selSize === size}
                          className={`pd-size-pill ${selSize === size ? 'is-active' : ''}`}
                          onClick={() => setSelSize(size)}
                          disabled={disabled}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasColor && (
                <div className="pd-block">
                  <div className="pd-block-head">
                    <span className="pd-block-title">Màu sắc</span>
                    {selColor && (
                      <span className="pd-block-selected">
                        {selColor}
                      </span>
                    )}
                  </div>
                  <div className="pd-color-swatches" role="listbox" aria-label="Màu">
                    {colorsForSelection.map((color) => {
                      const v = variants.find(
                        (x) =>
                          getVariantColor(x) === color &&
                          (!hasSize || !selSize || getVariantSize(x) === selSize),
                      );
                      const disabled = !v || (v.stockQuantity ?? 0) <= 0;
                      const active = selColor === color;
                      const hx = v ? swatchHex(v) : hexFromColorName(color) || '#94a3b8';
                      return (
                        <button
                          key={color}
                          type="button"
                          role="option"
                          title={color}
                          aria-label={color}
                          aria-selected={active}
                          className={`pd-swatch ${active ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`}
                          onClick={() => !disabled && setSelColor(color)}
                          disabled={disabled}
                        >
                          <span className="pd-swatch-ring">
                            <span
                              className="pd-swatch-fill"
                              style={{ background: hx }}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pd-block">
                <span className="pd-block-title">Số lượng</span>
                <div className="pd-qty">
                  <button
                    type="button"
                    className="pd-qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Giảm"
                  >
                    <FiMinus size={16} />
                  </button>
                  <span className="pd-qty-val">{quantity}</span>
                  <button
                    type="button"
                    className="pd-qty-btn"
                    onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))}
                    disabled={isOutOfStock}
                    aria-label="Tăng"
                  >
                    <FiPlus size={16} />
                  </button>
                </div>
              </div>

              <div className="pd-actions">
                <button
                  type="button"
                  className="pd-btn pd-btn--outline"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <FiShoppingCart size={20} /> Thêm vào giỏ
                </button>
                <button
                  type="button"
                  className="pd-btn pd-btn--primary"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                >
                  Mua ngay
                </button>
                <button
                  type="button"
                  className={`pd-btn pd-btn--icon ${isInWishlist ? 'is-wished' : ''}`}
                  onClick={handleWishlist}
                  aria-label="Yêu thích"
                >
                  <FiHeart size={22} fill={isInWishlist ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="pd-perks">
                {PERKS.map(({ icon: Icon, label }) => (
                  <div key={label} className="pd-perk">
                    <Icon size={20} aria-hidden />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </Col>
        </Row>

        <div className="pd-tabs-section">
          <div className="pd-tab-nav">
            {['desc', 'reviews'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`pd-tab-btn ${activeTab === tab ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'desc'
                  ? 'Mô tả chi tiết'
                  : `Đánh giá${productReviews?.length ? ` (${productReviews.length})` : ''}`}
              </button>
            ))}
          </div>

          <div className="pd-tab-content">
            {activeTab === 'desc' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pd-description"
              >
                {longDesc ? (
                  <div className="pd-desc-html">{longDesc}</div>
                ) : (
                  <p className="pd-desc-empty">Chưa có mô tả chi tiết cho sản phẩm này.</p>
                )}
              </motion.div>
            )}
            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ReviewForm productId={pid} onSuccess={() => dispatch(fetchProductReviews(id))} />
                <div className="pd-reviews-list">
                  <ReviewList reviews={productReviews} />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Container>

      {lightboxOpen && (
        <div
          className="pd-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Ảnh phóng to"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="pd-lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Đóng"
          >
            <FiX size={28} />
          </button>
          <img
            src={mainSrc}
            alt=""
            className="pd-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {relatedProducts.length > 0 && (
        <div className="pd-related">
          <Container fluid="lg" className="pd-container">
            <div className="pd-related-header">
              <h2 className="pd-related-title">Sản phẩm tương tự</h2>
              <Link
                to={`/products?category=${typeof product.categoryId === 'object'
                  ? (product.categoryId._id || product.categoryId.id)
                  : product.categoryId}`}
                className="pd-related-see-all"
              >
                Xem tất cả <FiChevronRight size={16} />
              </Link>
            </div>
            <div className="pd-related-grid">
              {relatedProducts.map((p, i) => (
                <motion.div
                  key={p._id || p.id}
                  className="pd-related-item"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </Container>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
