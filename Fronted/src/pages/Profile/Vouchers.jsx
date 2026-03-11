import { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Badge, Tabs, Tab } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAvailableVouchers,
  fetchUserVouchers,
  receiveVoucher,
} from '../../store/slices/voucherSlice';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';
import './Vouchers.css';

const Vouchers = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { availableVouchers, userVouchers, isLoading } = useSelector(
    (state) => state.vouchers
  );

  useEffect(() => {
    dispatch(fetchAvailableVouchers());
    dispatch(fetchUserVouchers());
  }, [dispatch]);

  const handleReceiveVoucher = async (voucherId) => {
    const result = await dispatch(receiveVoucher(voucherId));
    if (receiveVoucher.fulfilled.match(result)) {
      toast.success('Voucher received successfully!');
      dispatch(fetchAvailableVouchers());
      dispatch(fetchUserVouchers());
    } else {
      toast.error(result.payload || 'Failed to receive voucher');
    }
  };

  if (isLoading) return <Loading />;

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">My Vouchers</h5>
      </Card.Header>
      <Card.Body>
        <Tabs defaultActiveKey="available" className="mb-4">
          <Tab eventKey="available" title="Available Vouchers">
            {availableVouchers.length === 0 ? (
              <p className="text-muted">No available vouchers</p>
            ) : (
              <Row>
                {availableVouchers.map((voucher) => (
                  <Col md={6} key={voucher.id} className="mb-3">
                    <Card className="voucher-card h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="fw-bold text-accent">{voucher.voucherCode}</h5>
                            <p className="mb-1">{voucher.description}</p>
                          </div>
                          <Badge bg="success">
                            {voucher.discountType === 'Percentage'
                              ? `${voucher.discountValue}%`
                              : `${voucher.discountValue.toLocaleString('vi-VN')} ₫`}
                          </Badge>
                        </div>
                        {voucher.minPurchaseAmount && (
                          <p className="text-muted small mb-2">
                            Min purchase: {voucher.minPurchaseAmount.toLocaleString('vi-VN')} ₫
                          </p>
                        )}
                        {voucher.expiryDate && (
                          <p className="text-muted small mb-3">
                            Expires: {new Date(voucher.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleReceiveVoucher(voucher.id)}
                          className="w-100"
                        >
                          Receive Voucher
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Tab>
          <Tab eventKey="my-vouchers" title="My Vouchers">
            {userVouchers.length === 0 ? (
              <p className="text-muted">You don't have any vouchers yet</p>
            ) : (
              <Row>
                {userVouchers.map((userVoucher) => {
                  const voucher = userVoucher.voucher;
                  return (
                    <Col md={6} key={userVoucher.id} className="mb-3">
                      <Card className="voucher-card h-100">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h5 className="fw-bold text-accent">{voucher.voucherCode}</h5>
                              <p className="mb-1">{voucher.description}</p>
                            </div>
                            <Badge bg={userVoucher.isUsed ? 'secondary' : 'success'}>
                              {userVoucher.isUsed ? 'Used' : 'Active'}
                            </Badge>
                          </div>
                          {voucher.discountType === 'Percentage' ? (
                            <p className="fw-bold fs-4 text-accent">
                              {voucher.discountValue}% OFF
                            </p>
                          ) : (
                            <p className="fw-bold fs-4 text-accent">
                              {voucher.discountValue.toLocaleString('vi-VN')} ₫ OFF
                            </p>
                          )}
                          {voucher.expiryDate && (
                            <p className="text-muted small">
                              Expires: {new Date(voucher.expiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
};

export default Vouchers;
