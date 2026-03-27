import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiShoppingCart, FiHeart, FiStar, FiZoomIn,
  FiTruck, FiShield, FiRefreshCw, FiMinus, FiPlus
} from 'react-icons/fi';
import { fetchProductById } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import { fetchProductReviews } from '../../store/slices/reviewSlice';
import ReviewForm from '../../components/Reviews/ReviewForm';
import ReviewList from '../../components/Reviews/ReviewList';
import Loading from '../../components/Loading/Loading';
import { toast } from 'react-toastify';
import './ProductDetail.css';

const fmt = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const PERKS = [
  { icon: FiTruck, label: 'Miễn phí vận chuyển\ncho đơn trên 500K' },
  { icon: FiShield, label: 'Bảo hành chính hãng\n12 tháng' },
  { icon: FiRefreshCw, label: 'Đổi trả miễn phí\ntrong 30 ngày' },
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { product, isLoading } = useSelector((s) => s.products);
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { items: wishlistItems } = useSelector((s) => s.wishlist);
  const { productReviews } = useSelector((s) => s.reviews);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState('desc');

  useEffect(() => {
    dispatch(fetchProductById(id));
    dispatch(fetchProductReviews(id));
    setActiveImg(0);
    setSelectedVariant(null);
  }, [id, dispatch]);

  useEffect(() => {
    if (product?.variants?.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  if (isLoading) return <Loading />;
  if (!product) return (
    <div className="pd-not-found">
      <p>Sản phẩm không tồn tại</p>
      <button onClick={() => navigate('/products')} className="pd-back-btn">← Quay lại</button>
    </div>
  );

  const images = product.images?.length > 0
    ? product.images.map((i) => i.imageUrl)
    : ['/placeholder.jpg'];

  const pid = product.id || product._id;
  const isInWishlist = wishlistItems?.some((i) => i.productId === pid);
  const price = selectedVariant?.price || product.variants?.[0]?.price || product.price || 0;
  const stock = selectedVariant?.stockQuantity ?? 0;
  const isOutOfStock = !selectedVariant || stock === 0;
  const rating = product.rating || product.averageRating;

  const availableSizes = [...new Set((product.variants || []).filter(v => v.size).map(v => v.size))];
  const availableColors = [...new Set((product.variants || []).filter(v => v.color).map(v => v.color))];

  const handleAddToCart = () => {
    if (!isAuthenticated) { toast.info('Vui lòng đăng nhập'); navigate('/login'); return; }
    const pid = product?._id || product?.id;
    if (!pid) { toast.error('Không tìm thấy sản phẩm'); return; }
    dispatch(addToCart({ productId: pid, quantity }));
    toast.success('Đã thêm vào giỏ hàng 🛒');
  };

  const handleBuyNow = () => { handleAddToCart(); navigate('/cart'); };

  const handleWishlist = () => {
    if (!isAuthenticated) { toast.info('Vui lòng đăng nhập'); navigate('/login'); return; }
    dispatch(toggleWishlist(pid));
    toast.success(isInWishlist ? 'Đã xoá khỏi yêu thích' : 'Đã thêm vào yêu thích ❤️');
  };

  return (
    <div className="pd-page">
      <Container>
        <Row className="g-5">
          {/* ── LEFT: Gallery ── */}
          <Col lg={6}>
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
            >
              {/* Main image */}
              <div className="pd-main-img-wrap">
                <motion.img
                  key={activeImg}
                  src={images[activeImg]}
                  alt={product.productName}
                  className="pd-main-img"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
                />
                <button className="pd-zoom-btn" aria-label="Zoom"><FiZoomIn size={18} /></button>
                {isOutOfStock && <div className="pd-oos-overlay">Hết hàng</div>}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="pd-thumbs">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      className={`pd-thumb ${i === activeImg ? 'active' : ''}`}
                      onClick={() => setActiveImg(i)}
                    >
                      <img src={src} alt="" onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }} />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </Col>

          {/* ── RIGHT: Detail ── */}
          <Col lg={6}>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              {/* Brand & Name */}
              {product.brand?.brandName && (
                <span className="pd-brand">{product.brand.brandName}</span>
              )}
              <h1 className="pd-name">{product.productName}</h1>

              {/* Rating */}
              {rating && (
                <div className="pd-rating">
                  {[1,2,3,4,5].map(s => (
                    <FiStar key={s} size={14}
                      fill={s <= Math.round(rating) ? '#F59E0B' : 'none'}
                      color={s <= Math.round(rating) ? '#F59E0B' : '#CBD5E1'}
                    />
                  ))}
                  <span className="pd-rating-text">{rating.toFixed(1)}</span>
                  {product.reviewCount > 0 && <span className="pd-review-count">({product.reviewCount} đánh giá)</span>}
                </div>
              )}

              {/* Price */}
              <div className="pd-price-block">
                <span className="pd-price">{fmt(price)}</span>
                {selectedVariant?.stockQuantity > 0 && (
                  <span className="pd-in-stock">✓ Còn hàng ({stock})</span>
                )}
              </div>

              {/* Size picker */}
              {availableSizes.length > 0 && (
                <div className="pd-picker-group">
                  <p className="pd-picker-label">Size</p>
                  <div className="pd-picker-options">
                    {availableSizes.map((size) => {
                      const v = product.variants.find(v => v.size === size);
                      return (
                        <button
                          key={size}
                          className={`pd-size-btn ${selectedVariant?.size === size ? 'active' : ''}`}
                          onClick={() => setSelectedVariant(v)}
                          disabled={v?.stockQuantity === 0}
                        >{size}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color picker */}
              {availableColors.length > 0 && (
                <div className="pd-picker-group">
                  <p className="pd-picker-label">Màu sắc</p>
                  <div className="pd-picker-options">
                    {availableColors.map((color) => {
                      const v = product.variants.find(v => v.color === color);
                      return (
                        <button
                          key={color}
                          className={`pd-color-btn ${selectedVariant?.color === color ? 'active' : ''}`}
                          onClick={() => setSelectedVariant(v)}
                          disabled={v?.stockQuantity === 0}
                          title={color}
                        >
                          <span>{color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="pd-picker-group">
                <p className="pd-picker-label">Số lượng</p>
                <div className="pd-qty-row">
                  <div className="pd-qty-ctrl">
                    <button className="pd-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <FiMinus size={14} />
                    </button>
                    <span className="pd-qty-num">{quantity}</span>
                    <button className="pd-qty-btn" onClick={() => setQuantity(Math.min(stock || 1, quantity + 1))}>
                      <FiPlus size={14} />
                    </button>
                  </div>
                  {stock > 0 && <span className="pd-stock-hint">Còn {stock} sản phẩm</span>}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pd-actions">
                <motion.button
                  className="pd-btn-cart"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiShoppingCart size={18} /> Thêm vào giỏ
                </motion.button>
                <motion.button
                  className="pd-btn-buy"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Mua ngay
                </motion.button>
                <motion.button
                  className={`pd-btn-wish ${isInWishlist ? 'wished' : ''}`}
                  onClick={handleWishlist}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiHeart size={18} fill={isInWishlist ? 'currentColor' : 'none'} />
                </motion.button>
              </div>

              {/* Perks */}
              <div className="pd-perks">
                {PERKS.map(({ icon: Icon, label }) => (
                  <div key={label} className="pd-perk">
                    <Icon size={18} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </Col>
        </Row>

        {/* ── TABS: Description + Reviews ── */}
        <div className="pd-tabs-section">
          <div className="pd-tab-nav">
            {['desc', 'reviews'].map((tab) => (
              <button
                key={tab}
                className={`pd-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'desc' ? 'Mô tả sản phẩm' : `Đánh giá${productReviews?.length ? ` (${productReviews.length})` : ''}`}
              </button>
            ))}
          </div>

          <div className="pd-tab-content">
            {activeTab === 'desc' && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="pd-description"
              >
                {product.description || 'Chưa có mô tả cho sản phẩm này.'}
              </motion.div>
            )}
            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ReviewForm
                  productId={pid}
                  onSuccess={() => dispatch(fetchProductReviews(id))}
                />
                <div className="pd-reviews-list">
                  <ReviewList reviews={productReviews} />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProductDetail;
