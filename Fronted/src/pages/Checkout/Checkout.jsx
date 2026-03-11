import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../../store/slices/orderSlice';
import { fetchCart, clearCart } from '../../store/slices/cartSlice';
import { fetchUserVouchers } from '../../store/slices/voucherSlice';
import { fetchAddresses } from '../../store/slices/addressSlice';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';
import './Checkout.css';

const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  ward: z.string().min(1, 'Ward is required'),
});

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, subtotal } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { isLoading } = useSelector((state) => state.orders);
  const { addresses } = useSelector((state) => state.addresses);
  const { userVouchers } = useSelector((state) => state.vouchers);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    dispatch(fetchAddresses());
    dispatch(fetchUserVouchers());
  }, [dispatch]);

  useEffect(() => {
    if (addresses.length > 0) {
      const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    } else {
      setUseNewAddress(true);
    }
  }, [addresses]);

  const onSubmit = async (data) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    const orderData = {
      addressId: selectedAddressId,
      shippingMethodId: 1, // Default shipping method
      items: items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      ...(useNewAddress && { newAddress: data }),
      ...(selectedVoucherId && { voucherId: selectedVoucherId }),
    };

    try {
      const result = await dispatch(createOrder(orderData));
      if (createOrder.fulfilled.match(result)) {
        toast.success('Order placed successfully!');
        dispatch(clearCart());
        navigate(`/profile/orders`);
      } else {
        toast.error(result.payload || 'Failed to place order');
      }
    } catch (error) {
      toast.error('Failed to place order');
    }
  };

  const shipping = 50000;
  const tax = subtotal * 0.1;
  
  // Calculate voucher discount
  let voucherDiscount = 0;
  if (selectedVoucherId) {
    const selectedVoucher = userVouchers.find(
      (v) => v.voucher.id === selectedVoucherId && !v.isUsed
    );
    if (selectedVoucher) {
      const voucher = selectedVoucher.voucher;
      if (voucher.discountType === 'Percentage') {
        voucherDiscount = (subtotal * voucher.discountValue) / 100;
      } else {
        voucherDiscount = voucher.discountValue;
      }
    }
  }
  
  const total = subtotal + shipping + tax - voucherDiscount;

  if (items.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">Your cart is empty</Alert>
        <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
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
        {t('checkout.title')}
      </motion.h2>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">{t('checkout.shipping')}</h5>
              </Card.Header>
              <Card.Body>
                {addresses.length > 0 && !useNewAddress && (
                  <div className="mb-3">
                    <Form.Label>Select Address</Form.Label>
                    {addresses.map((address) => (
                      <Form.Check
                        key={address.id}
                        type="radio"
                        name="address"
                        id={`address-${address.id}`}
                        label={`${address.fullName} - ${address.address}, ${address.ward}, ${address.district}, ${address.city}`}
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                      />
                    ))}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setUseNewAddress(true)}
                    >
                      Use New Address
                    </Button>
                  </div>
                )}

                {useNewAddress && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6>New Address</h6>
                      {addresses.length > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setUseNewAddress(false)}
                        >
                          Use Existing Address
                        </Button>
                      )}
                    </div>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name *</Form.Label>
                          <Form.Control
                            {...register('fullName')}
                            defaultValue={user?.firstName + ' ' + user?.lastName}
                          />
                          {errors.fullName && (
                            <Form.Text className="text-danger">{errors.fullName.message}</Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone *</Form.Label>
                          <Form.Control
                            {...register('phone')}
                            defaultValue={user?.phone}
                          />
                          {errors.phone && (
                            <Form.Text className="text-danger">{errors.phone.message}</Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Address *</Form.Label>
                      <Form.Control {...register('address')} />
                      {errors.address && (
                        <Form.Text className="text-danger">{errors.address.message}</Form.Text>
                      )}
                    </Form.Group>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>City *</Form.Label>
                          <Form.Control {...register('city')} />
                          {errors.city && (
                            <Form.Text className="text-danger">{errors.city.message}</Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>District *</Form.Label>
                          <Form.Control {...register('district')} />
                          {errors.district && (
                            <Form.Text className="text-danger">{errors.district.message}</Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Ward *</Form.Label>
                          <Form.Control {...register('ward')} />
                          {errors.ward && (
                            <Form.Text className="text-danger">{errors.ward.message}</Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h5 className="mb-0">{t('checkout.payment')}</h5>
              </Card.Header>
              <Card.Body>
                <Form.Check
                  type="radio"
                  name="payment"
                  id="cod"
                  label="Cash on Delivery"
                  defaultChecked
                />
                <Form.Check
                  type="radio"
                  name="payment"
                  id="bank"
                  label="Bank Transfer"
                  disabled
                />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="sticky-top" style={{ top: '100px' }}>
              <Card.Header>
                <h5 className="mb-0">{t('checkout.orderSummary')}</h5>
              </Card.Header>
              <Card.Body>
                {items.map((item) => (
                  <div key={item.id} className="d-flex justify-content-between mb-2">
                    <span>
                      {item.productName} x {item.quantity}
                    </span>
                    <span>{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</span>
                  </div>
                ))}
                <hr />
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
                <div className="d-flex justify-content-between mb-4">
                  <strong>{t('cart.total')}</strong>
                  <strong className="text-accent fs-5">{total.toLocaleString('vi-VN')} ₫</strong>
                </div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loading /> : t('checkout.placeOrder')}
                  </Button>
                </motion.div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default Checkout;
