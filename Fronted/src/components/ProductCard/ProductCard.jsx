import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import './ProductCard.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { items: wishlistItems } = useSelector((s) => s.wishlist);
  const isInWishlist = wishlistItems?.some((i) => i.productId === product.id || i.productId === product._id);

  const rawImg = product.images?.[0]?.imageUrl || product.image;
  const mainImage = resolveMediaUrl(rawImg) || '/placeholder.jpg';
  const price = product.variants?.[0]?.price || product.defaultPrice || product.price || 0;
  const originalPrice = product.originalPrice;
  const isOnSale = originalPrice && originalPrice > price;
  const discount = isOnSale ? Math.round((1 - price / originalPrice) * 100) : 0;
  const isOutOfStock = product.variants?.length > 0 && product.variants.every((v) => v.stockQuantity === 0);
  const isFeatured = product.isFeatured;
  const rating = product.rating || product.averageRating;
  const reviewCount = product.reviewCount || product.totalReviews;

  const handleWishlist = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.info('Vui lòng đăng nhập để thêm vào yêu thích'); return; }
    const pid = product.id || product._id;
    dispatch(toggleWishlist(pid));
    toast.success(isInWishlist ? 'Đã xoá khỏi yêu thích' : 'Đã thêm vào yêu thích ❤️');
  };

  const handleAddToCart = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.info('Vui lòng đăng nhập để thêm vào giỏ'); return; }
    if (isOutOfStock) return;
    const pid = product._id || product.id;
    if (!pid) return;
    dispatch(addToCart({ productId: pid.toString(), quantity: 1 }));
    toast.success('Đã thêm vào giỏ hàng 🛒');
  };

  return (
    <motion.div
      className="pc-wrapper"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover="hover"
      transition={{ duration: 0.3 }}
    >
      <Link to={`/products/${product.id || product._id}`} className="pc-link" tabIndex={-1}>
        <div className="pc-card">
          {/* ── Image area ── */}
          <div className="pc-image-wrap">
            <motion.img
              src={mainImage}
              alt={product.productName}
              className="pc-image"
              variants={{ hover: { scale: 1.07 } }}
              transition={{ duration: 0.4 }}
              onError={(e) => { e.currentTarget.src = '/placeholder.jpg'; }}
              loading="lazy"
            />

            {/* Badges */}
            <div className="pc-badges">
              {isOutOfStock && <span className="pc-badge badge-sold">Hết hàng</span>}
              {isFeatured && !isOutOfStock && <span className="pc-badge badge-hot">HOT 🔥</span>}
              {isOnSale && !isOutOfStock && <span className="pc-badge badge-sale">-{discount}%</span>}
            </div>

            {/* Wishlist */}
            <motion.button
              className={`pc-wish-btn ${isInWishlist ? 'wished' : ''}`}
              onClick={handleWishlist}
              whileTap={{ scale: 0.85 }}
              aria-label="Wishlist"
            >
              <FiHeart size={16} fill={isInWishlist ? 'currentColor' : 'none'} />
            </motion.button>

            {/* Quick Add overlay */}
            <motion.div
              className="pc-quick-add"
              variants={{ hover: { opacity: 1, y: 0 } }}
              initial={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <button
                className="pc-cart-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <FiShoppingCart size={15} />
                {isOutOfStock ? 'Hết hàng' : 'Thêm nhanh'}
              </button>
            </motion.div>
          </div>

          {/* ── Info area ── */}
          <div className="pc-body">
            {(typeof product.brand === 'string' && product.brand) ||
            product.brand?.brandName ? (
              <span className="pc-brand">
                {typeof product.brand === 'string' ? product.brand : product.brand.brandName}
              </span>
            ) : null}
            <h3 className="pc-name">{product.productName}</h3>

            {/* Rating */}
            {rating && (
              <div className="pc-rating">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FiStar
                    key={s}
                    size={12}
                    fill={s <= Math.round(rating) ? '#F59E0B' : 'none'}
                    color={s <= Math.round(rating) ? '#F59E0B' : '#CBD5E1'}
                  />
                ))}
                <span className="pc-rating-text">
                  {rating.toFixed(1)}{reviewCount ? ` (${reviewCount})` : ''}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="pc-price-wrap">
              <span className="pc-price">{formatPrice(price)}</span>
              {isOnSale && (
                <span className="pc-price-original">{formatPrice(originalPrice)}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
