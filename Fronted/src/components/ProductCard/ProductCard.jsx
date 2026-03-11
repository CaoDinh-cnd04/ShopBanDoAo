import { Link } from 'react-router-dom';
import { Card, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FiHeart } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const isInWishlist = wishlistItems.some((item) => item.productId === product.id);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please login to add to wishlist');
      return;
    }
    if (isInWishlist) {
      const wishlistItem = wishlistItems.find((item) => item.productId === product.id);
      dispatch(removeFromWishlist(wishlistItem.id));
      toast.success('Removed from wishlist');
    } else {
      dispatch(addToWishlist(product.id));
      toast.success('Added to wishlist');
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please login to add to cart');
      return;
    }
    // Get first available variant
    const variant = product.variants?.[0];
    if (variant) {
      dispatch(addToCart({ variantId: variant.id, quantity: 1 }));
      toast.success('Added to cart');
    }
  };

  const mainImage = product.images?.[0]?.imageUrl || '/placeholder.jpg';
  const price = product.variants?.[0]?.price || product.price || 0;
  const isOutOfStock = product.variants?.every((v) => v.stockQuantity === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Card className="product-card h-100">
        <Link to={`/products/${product.id}`} className="text-decoration-none">
          <motion.div
            className="product-image-wrapper position-relative"
            whileHover={{ scale: 1.02 }}
          >
            <Card.Img
              variant="top"
              src={mainImage}
              alt={product.productName}
              className="product-image"
            />
            {isOutOfStock && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Badge bg="danger" className="position-absolute top-0 end-0 m-2">
                  {t('products.outOfStock')}
                </Badge>
              </motion.div>
            )}
            <motion.button
              className="wishlist-btn position-absolute bottom-0 end-0 m-2"
              onClick={handleWishlist}
              whileHover={{ scale: 1.2, rotate: 360 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <FiHeart
                size={20}
                fill={isInWishlist ? '#ef4444' : 'none'}
                color={isInWishlist ? '#ef4444' : 'white'}
              />
            </motion.button>
          </motion.div>
          <Card.Body className="d-flex flex-column">
            <Card.Title className="text-dark mb-2 fw-bold">{product.productName}</Card.Title>
            <Card.Text className="text-muted small mb-2">{product.brand?.brandName}</Card.Text>
            <div className="mt-auto">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <motion.span
                  className="fw-bold fs-5 gradient-text"
                  whileHover={{ scale: 1.1 }}
                >
                  {price.toLocaleString('vi-VN')} ₫
                </motion.span>
                {product.rating && (
                  <motion.span
                    className="text-warning"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ⭐ {product.rating.toFixed(1)}
                  </motion.span>
                )}
              </div>
              <motion.button
                className="btn btn-primary w-100"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('products.addToCart')}
              </motion.button>
            </div>
          </Card.Body>
        </Link>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
