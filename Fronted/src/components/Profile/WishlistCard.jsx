import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import './WishlistCard.css';

const WishlistCard = ({ item }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Backend populate: item.productId là object { _id, productName, defaultPrice, images, ... }
  const product = (item.productId && typeof item.productId === 'object')
    ? item.productId
    : (item.product || item.Product || {});

  const productId = product._id?.toString() || product.id?.toString() || item.productId?.toString() || '';
  const productName = product.productName || product.ProductName || product.name || 'Sản phẩm';
  const price = product.defaultPrice || product.price || product.Price || 0;
  const image = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : product.imageUrl || product.ImageURL || null;

  const handleRemove = async () => {
    if (!productId) return;
    const result = await dispatch(toggleWishlist(productId));
    if (toggleWishlist.fulfilled.match(result)) {
      toast.success('Đã xóa khỏi danh sách yêu thích');
    } else {
      toast.error(result.payload || 'Không thể xóa sản phẩm');
    }
  };

  const handleAddToCart = async () => {
    if (!productId) return;
    const result = await dispatch(addToCart({ productId, quantity: 1 }));
    if (addToCart.fulfilled.match(result)) {
      toast.success('Đã thêm vào giỏ hàng!');
    } else {
      toast.error(result.payload || 'Không thể thêm vào giỏ hàng');
    }
  };

  return (
    <motion.div
      className="wishlist-card-wrap"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -3 }}
    >
      <div className="wishlist-card">
        <div className="wishlist-img-wrap">
          <img
            src={image || '/placeholder-category.svg'}
            alt={productName}
            className="wishlist-img"
            onClick={() => productId && navigate(`/products/${productId}`)}
          />
          <button className="wishlist-remove-btn" onClick={handleRemove} title="Xóa khỏi yêu thích">
            <FiHeart size={14} />
          </button>
        </div>

        <div className="wishlist-info">
          <p
            className="wishlist-name"
            onClick={() => productId && navigate(`/products/${productId}`)}
          >
            {productName}
          </p>
          <p className="wishlist-price">
            {price > 0
              ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
              : 'Liên hệ'}
          </p>
          <div className="wishlist-actions">
            <button
              className="wishlist-btn-view"
              onClick={() => productId && navigate(`/products/${productId}`)}
            >
              <FiEye size={13} /> Xem
            </button>
            <button className="wishlist-btn-cart" onClick={handleAddToCart}>
              <FiShoppingCart size={13} /> Thêm giỏ
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

WishlistCard.propTypes = {
  item: PropTypes.object.isRequired,
};

export default WishlistCard;
