import { useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, updateCartItem, removeFromCart, clearCart } from '../../store/slices/cartSlice';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import Loading from '../../components/Loading/Loading';
import { toast } from 'react-toastify';
import './Cart.css';

const Cart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, subtotal, isLoading } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart(itemId));
    } else {
      dispatch(updateCartItem({ cartItemId: itemId, quantity: newQuantity }));
    }
  };

  const handleRemove = (itemId) => {
    dispatch(removeFromCart(itemId));
    toast.success('Item removed from cart');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
      toast.success('Cart cleared');
    }
  };

  const shipping = 50000; // Fixed shipping cost
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;

  if (isLoading) return <Loading />;

  if (items.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h2 className="mb-4">{t('cart.title')}</h2>
        <p className="text-muted mb-4">{t('cart.empty')}</p>
        <Button as={Link} to="/products">
          {t('cart.continueShopping')}
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fw-bold mb-4 gradient-text"
        style={{ fontSize: '2.5rem' }}
      >
        {t('cart.title')}
      </motion.h2>
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Items ({items.length})</h5>
                <Button variant="link" size="sm" onClick={handleClearCart}>
                  Clear Cart
                </Button>
              </div>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ backgroundColor: 'rgba(13, 148, 136, 0.08)' }}
                    >
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={item.productImage || '/placeholder.jpg'}
                            alt={item.productName}
                            style={{ width: '80px', height: '80px', objectFit: 'cover', marginRight: '1rem' }}
                            className="rounded"
                          />
                          <div>
                            <Link to={`/products/${item.productId}`} className="text-decoration-none">
                              <strong>{item.productName}</strong>
                            </Link>
                            <br />
                            <small className="text-muted">
                              {item.size && `Size: ${item.size}`}
                              {item.color && ` | Color: ${item.color}`}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{item.price?.toLocaleString('vi-VN')} ₫</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Button
                            variant="outline-dark"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            <FiMinus />
                          </Button>
                          <span className="fw-bold">{item.quantity}</span>
                          <Button
                            variant="outline-dark"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <FiPlus />
                          </Button>
                        </div>
                      </td>
                      <td className="fw-bold">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                      </td>
                      <td>
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleRemove(item.id)}
                            className="text-danger"
                          >
                            <FiTrash2 />
                          </Button>
                        </motion.div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '100px' }}>
            <Card.Header>
              <h5 className="mb-0">{t('checkout.orderSummary')}</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>{t('cart.subtotal')}</span>
                <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>{t('cart.shipping')}</span>
                <span>{shipping.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>{t('cart.tax')}</span>
                <span>{tax.toLocaleString('vi-VN')} ₫</span>
              </div>
              <hr />
              <motion.div
                className="d-flex justify-content-between mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <strong>{t('cart.total')}</strong>
                <motion.strong
                  className="gradient-text fs-5"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {total.toLocaleString('vi-VN')} ₫
                </motion.strong>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mb-2"
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-100"
                  onClick={() => navigate('/checkout')}
                >
                  {t('cart.checkout')}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline-primary"
                  size="lg"
                  className="w-100"
                  as={Link}
                  to="/products"
                >
                  {t('cart.continueShopping')}
                </Button>
              </motion.div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;
