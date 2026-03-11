import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../../store/slices/addressSlice';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Loading from '../../components/Loading/Loading';

const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  ward: z.string().min(1, 'Ward is required'),
  isDefault: z.boolean().optional(),
});

const Addresses = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { addresses, isLoading } = useSelector((state) => state.addresses);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const handleOpenModal = (address = null) => {
    setEditingAddress(address);
    if (address) {
      reset({
        fullName: address.fullName,
        phone: address.phone,
        address: address.address,
        city: address.city,
        district: address.district,
        ward: address.ward,
        isDefault: address.isDefault || false,
      });
    } else {
      reset({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        isDefault: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAddress(null);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (editingAddress) {
        await dispatch(updateAddress({ id: editingAddress.id, addressData: data }));
        toast.success('Address updated successfully!');
      } else {
        await dispatch(createAddress(data));
        toast.success('Address created successfully!');
      }
      handleCloseModal();
      dispatch(fetchAddresses());
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await dispatch(deleteAddress(id));
        toast.success('Address deleted successfully!');
        dispatch(fetchAddresses());
      } catch (error) {
        toast.error('Failed to delete address');
      }
    }
  };

  if (isLoading) return <Loading />;

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{t('profile.addresses')}</h5>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <FiPlus className="me-2" />
            Add Address
          </Button>
        </Card.Header>
        <Card.Body>
          {addresses.length === 0 ? (
            <Alert variant="info">No addresses found. Add your first address!</Alert>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>Default</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map((address) => (
                  <tr key={address.id}>
                    <td>{address.fullName}</td>
                    <td>{address.phone}</td>
                    <td>
                      {address.address}, {address.ward}, {address.district}
                    </td>
                    <td>{address.city}</td>
                    <td>
                      {address.isDefault && (
                        <span className="badge bg-success">Default</span>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleOpenModal(address)}
                      >
                        <FiEdit />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger"
                        onClick={() => handleDelete(address.id)}
                      >
                        <FiTrash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control {...register('fullName')} />
                  {errors.fullName && (
                    <Form.Text className="text-danger">{errors.fullName.message}</Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control {...register('phone')} />
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
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Set as default address"
                {...register('isDefault')}
              />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button type="submit" variant="primary">
                {editingAddress ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Addresses;
