import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';

const AddressForm = ({ show, onHide, onSubmit, address, loading }) => {
    const [formData, setFormData] = useState({
        receiverName: '',
        receiverPhone: '',
        addressLine: '',
        ward: '',
        district: '',
        city: '',
        isDefault: false
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (address) {
            setFormData({
                receiverName: address.ReceiverName || '',
                receiverPhone: address.ReceiverPhone || '',
                addressLine: address.AddressLine || '',
                ward: address.Ward || '',
                district: address.District || '',
                city: address.City || '',
                isDefault: address.IsDefault || false
            });
        } else {
            setFormData({
                receiverName: '',
                receiverPhone: '',
                addressLine: '',
                ward: '',
                district: '',
                city: '',
                isDefault: false
            });
        }
    }, [address, show]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.receiverName.trim()) {
            newErrors.receiverName = 'Vui lòng nhập tên người nhận';
        }

        if (!formData.receiverPhone.trim()) {
            newErrors.receiverPhone = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10,11}$/.test(formData.receiverPhone.replace(/\s/g, ''))) {
            newErrors.receiverPhone = 'Số điện thoại không hợp lệ';
        }

        if (!formData.addressLine.trim()) {
            newErrors.addressLine = 'Vui lòng nhập địa chỉ';
        }

        if (!formData.district.trim()) {
            newErrors.district = 'Vui lòng nhập quận/huyện';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'Vui lòng nhập thành phố';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Vui lòng kiểm tra lại thông tin');
            return;
        }

        onSubmit(formData);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {address ? 'Chỉnh Sửa Địa Chỉ' : 'Thêm Địa Chỉ Mới'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Tên người nhận <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="receiverName"
                                    value={formData.receiverName}
                                    onChange={handleChange}
                                    isInvalid={!!errors.receiverName}
                                    placeholder="Nhập tên người nhận"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.receiverName}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Số điện thoại <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="receiverPhone"
                                    value={formData.receiverPhone}
                                    onChange={handleChange}
                                    isInvalid={!!errors.receiverPhone}
                                    placeholder="Nhập số điện thoại"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.receiverPhone}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>
                            Địa chỉ chi tiết <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="addressLine"
                            value={formData.addressLine}
                            onChange={handleChange}
                            isInvalid={!!errors.addressLine}
                            placeholder="Số nhà, tên đường..."
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.addressLine}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Phường/Xã</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="ward"
                                    value={formData.ward}
                                    onChange={handleChange}
                                    placeholder="Nhập phường/xã"
                                />
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Quận/Huyện <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    isInvalid={!!errors.district}
                                    placeholder="Nhập quận/huyện"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.district}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    Thành phố <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    isInvalid={!!errors.city}
                                    placeholder="Nhập thành phố"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.city}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            name="isDefault"
                            label="Đặt làm địa chỉ mặc định"
                            checked={formData.isDefault}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <div className="d-flex gap-2 justify-content-end">
                        <Button variant="secondary" onClick={onHide} disabled={loading}>
                            Hủy
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Đang xử lý...' : (address ? 'Cập nhật' : 'Thêm mới')}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddressForm;
