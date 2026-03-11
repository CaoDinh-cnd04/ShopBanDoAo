import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Form, Badge, Tabs, Tab } from 'react-bootstrap';
import { motion } from 'framer-motion';
import ImageGallery from 'react-image-gallery';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { fetchProductReviews } from '../../store/slices/reviewSlice';
import ReviewForm from '../../components/Reviews/ReviewForm';
import ReviewList from '../../components/Reviews/ReviewList';
import Loading from '../../components/Loading/Loading';
import { toast } from 'react-toastify';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { product, isLoading } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { productReviews } = useSelector((state) => state.reviews);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    dispatch(fetchProductById(id));
    dispatch(fetchProductReviews(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (product?.variants?.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product, selectedVariant]);

  if (isLoading) return <Loading />;
  if (!product) return <div>Product not found</div>;

  const images = product.images?.map((img) => ({
    original: img.imageUrl,
    thumbnail: img.imageUrl,
  })) || [{ original: '/placeholder.jpg', thumbnail: '/placeholder.jpg' }];

  const isInWishlist = wishlistItems.some((item) => item.productId === product.id);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.info('Please login to add to cart');
      navigate('/login');
      return;
    }
    if (!selectedVariant) {
      toast.error('Please select a variant');
      return;
    }
    dispatch(addToCart({ variantId: selectedVariant.id, quantity }));
    toast.success('Added to cart');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.info('Please login to add to wishlist');
      navigate('/login');
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

  const availableSizes = [...new Set(product.variants?.map((v) => v.size))];
  const availableColors = [...new Set(product.variants?.map((v) => v.color))];

  return (
    <Container className="py-5">
      <Row>
        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ImageGallery
              items={images}
              showPlayButton={false}
              showFullscreenButton={true}
            />
          </motion.div>
        </Col>
        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              className="fw-bold mb-3 gradient-text"
              style={{ fontSize: '2.5rem' }}
              whileHover={{ scale: 1.02 }}
            >
              {product.productName}
            </motion.h1>
            <p className="text-muted mb-3 fs-5">{product.brand?.brandName}</p>
            {product.rating && (
              <motion.div
                className="mb-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Badge bg="warning" className="me-2 fs-6">⭐ {product.rating.toFixed(1)}</Badge>
                <span className="text-muted">({product.reviewCount || 0} reviews)</span>
              </motion.div>
            )}
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="fw-bold gradient-text" style={{ fontSize: '2.5rem' }}>
                {selectedVariant?.price?.toLocaleString('vi-VN') || product.price?.toLocaleString('vi-VN')} ₫
              </h2>
            </motion.div>

          {/* Size Selection */}
          {availableSizes.length > 0 && (
            <motion.div
              className="mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="fw-bold mb-2">{t('product.selectSize')}</label>
              <div className="d-flex gap-2 flex-wrap">
                {availableSizes.map((size) => {
                  const variant = product.variants.find((v) => v.size === size);
                  return (
                    <motion.div
                      key={size}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant={selectedVariant?.size === size ? 'primary' : 'outline-primary'}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={variant?.stockQuantity === 0}
                      >
                        {size}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Color Selection */}
          {availableColors.length > 0 && (
            <motion.div
              className="mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="fw-bold mb-2">{t('product.selectColor')}</label>
              <div className="d-flex gap-2 flex-wrap">
                {availableColors.map((color) => {
                  const variant = product.variants.find((v) => v.color === color);
                  return (
                    <motion.div
                      key={color}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant={selectedVariant?.color === color ? 'primary' : 'outline-primary'}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={variant?.stockQuantity === 0}
                      >
                        {color}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Quantity */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="fw-bold mb-2">{t('product.quantity')}</label>
            <div className="d-flex align-items-center gap-3">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline-primary"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
              </motion.div>
              <motion.span
                className="fw-bold fs-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3 }}
                key={quantity}
              >
                {quantity}
              </motion.span>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline-primary"
                  onClick={() => setQuantity(Math.min(selectedVariant?.stockQuantity || 1, quantity + 1))}
                >
                  +
                </Button>
              </motion.div>
              <span className="text-muted">
                {selectedVariant?.stockQuantity || 0} {t('products.inStock')}
              </span>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="d-flex gap-3 mb-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-grow-1"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-100"
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stockQuantity === 0}
              >
                {t('product.addToCart')}
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline-primary"
                size="lg"
                onClick={handleBuyNow}
                disabled={!selectedVariant || selectedVariant.stockQuantity === 0}
              >
                {t('product.buyNow')}
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.2, rotate: 360 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="outline-danger"
                size="lg"
                onClick={handleWishlist}
                className="px-3"
              >
                ❤️
              </Button>
            </motion.div>
          </motion.div>

          {/* Product Info Tabs */}
          <Tabs defaultActiveKey="description" className="mb-4">
            <Tab eventKey="description" title={t('product.description')}>
              <div className="p-3">
                <p>{product.description || 'No description available.'}</p>
              </div>
            </Tab>
            <Tab eventKey="reviews" title={t('product.reviews')}>
              <div className="p-3">
                <ReviewForm
                  productId={product.id}
                  onSuccess={() => dispatch(fetchProductReviews(id))}
                />
                <div className="mt-4">
                  <h5 className="mb-3">Customer Reviews</h5>
                  <ReviewList reviews={productReviews} />
                </div>
              </div>
            </Tab>
          </Tabs>
          </motion.div>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;
