import PropTypes from 'prop-types';
import { Card, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaHeart, FaShoppingCart, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { removeFromWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import './WishlistCard.css';

const WishlistCard = ({ item }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const product = item.product || item.Product || {};
    const wishlistItemId = item.WishlistItemID || item.id;

    const handleRemove = async () => {
        const result = await dispatch(removeFromWishlist(wishlistItemId));
        if (removeFromWishlist.fulfilled.match(result)) {
            toast.success('Đã xóa khỏi danh sách yêu thích');
        } else {
            toast.error('Không thể xóa sản phẩm');
        }
    };

    const handleAddToCart = async () => {
        const result = await dispatch(addToCart({
            productId: product.ProductID || product.id,
            quantity: 1,
        }));
        if (addToCart.fulfilled.match(result)) {
            toast.success('Đã thêm vào giỏ hàng');
        } else {
            toast.error('Không thể thêm vào giỏ hàng');
        }
    };

    const isOutOfStock = (product.Stock || product.stock || 0) === 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5 }}
        >
            <Card className="wishlist-card h-100 shadow-sm">
                <div className="wishlist-card-image-wrapper">
                    <Card.Img
                        variant="top"
                        src={product.ImageURL || product.imageUrl || '/placeholder-product.jpg'}
                        alt={product.ProductName || product.name}
                        className="wishlist-card-image"
                        onClick={() => navigate(`/products/${product.ProductID || product.id}`)}
                    />
                    <Button
                        variant="danger"
                        size="sm"
                        className="wishlist-remove-btn"
                        onClick={handleRemove}
                    >
                        <FaHeart />
                    </Button>
                    {isOutOfStock && (
                        <div className="out-of-stock-badge">
                            Hết hàng
                        </div>
                    )}
                </div>

                <Card.Body className="d-flex flex-column">
                    <Card.Title
                        className="wishlist-card-title"
                        onClick={() => navigate(`/products/${product.ProductID || product.id}`)}
                    >
                        {product.ProductName || product.name}
                    </Card.Title>

                    <div className="mt-auto">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h5 className="text-primary mb-0">
                                {(product.Price || product.price)?.toLocaleString('vi-VN')} ₫
                            </h5>
                            {product.OriginalPrice && product.OriginalPrice > product.Price && (
                                <small className="text-muted text-decoration-line-through">
                                    {product.OriginalPrice.toLocaleString('vi-VN')} ₫
                                </small>
                            )}
                        </div>

                        <div className="d-flex gap-2">
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="flex-grow-1"
                                onClick={() => navigate(`/products/${product.ProductID || product.id}`)}
                            >
                                <FaEye className="me-1" />
                                Xem
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="flex-grow-1"
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                            >
                                <FaShoppingCart className="me-1" />
                                {isOutOfStock ? 'Hết hàng' : 'Mua'}
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </motion.div>
    );
};

WishlistCard.propTypes = {
    item: PropTypes.shape({
        WishlistItemID: PropTypes.number,
        id: PropTypes.number,
        product: PropTypes.shape({
            ProductID: PropTypes.number,
            id: PropTypes.number,
            ProductName: PropTypes.string,
            name: PropTypes.string,
            Price: PropTypes.number,
            price: PropTypes.number,
            OriginalPrice: PropTypes.number,
            ImageURL: PropTypes.string,
            imageUrl: PropTypes.string,
            Stock: PropTypes.number,
            stock: PropTypes.number,
        }),
        Product: PropTypes.object,
    }).isRequired,
};

export default WishlistCard;
