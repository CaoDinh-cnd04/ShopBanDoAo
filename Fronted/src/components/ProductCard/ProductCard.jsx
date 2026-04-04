import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { getDefaultVariantIdForProduct } from '../../utils/cartVariant';
import './ProductCard.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const ProductCard = ({ product, showHotBadge = false, promoDiscount = 0 }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { items: wishlistItems } = useSelector((s) => s.wishlist);
  const isInWishlist = wishlistItems?.some((i) => i.productId === product.id || i.productId === product._id);

  const rawImg = product.images?.[0]?.imageUrl || product.image;
  const mainImage = resolveMediaUrl(rawImg) || '/placeholder.svg';
  const basePrice = product.variants?.[0]?.price || product.defaultPrice || product.price || 0;
  // promoDiscount (%) overrides static originalPrice when set
  const promoSalePrice = promoDiscount > 0
    ? Math.round(basePrice * (1 - promoDiscount / 100))
    : null;
  const price = promoSalePrice ?? basePrice;
  const originalPrice = promoSalePrice ? basePrice : product.originalPrice;
  const isOnSale = originalPrice && originalPrice > price;
  const discount = promoDiscount > 0
    ? promoDiscount
    : isOnSale ? Math.round((1 - price / originalPrice) * 100) : 0;
  const isOutOfStock = product.variants?.length > 0 && product.variants.every((v) => v.stockQuantity === 0);
  const isFeatured = product.isFeatured || showHotBadge;
  const rating = product.rating || product.averageRating;
  const reviewCount = product.reviewCount || product.totalReviews;

  const handleWishlist = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { toast.info(t('productCard.loginWishlist')); return; }
    const pid = product.id || product._id;
    dispatch(toggleWishlist(pid));
    toast.success(isInWishlist ? t('productCard.removedWishlist') : t('productCard.addedWishlist'));
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info(t('productCard.loginCart'));
      return;
    }
    if (isOutOfStock) return;
    const pid = product._id || product.id;
    if (!pid) return;
    const variantId = getDefaultVariantIdForProduct(product);
    const body = { productId: pid.toString(), quantity: 1 };
    if (variantId) body.variantId = variantId;
    const res = await dispatch(addToCart(body));
    if (addToCart.fulfilled.match(res)) {
      toast.success(t('productCard.addedCart'));
    } else {
      const msg = res.payload;
      toast.error(typeof msg === 'string' ? msg : t('productCard.addCartFail'));
    }
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
              onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
              loading="lazy"
            />

            {/* Badges */}
            <div className="pc-badges">
              {isOutOfStock && <span className="pc-badge badge-sold">{t('productCard.outOfStock')}</span>}
              {isFeatured && !isOutOfStock && <span className="pc-badge badge-hot">{t('productCard.hot')}</span>}
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
                {isOutOfStock ? t('productCard.outOfStock') : t('productCard.quickAdd')}
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
            <div className={`pc-price-wrap${isOnSale ? ' on-sale' : ''}`}>
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
