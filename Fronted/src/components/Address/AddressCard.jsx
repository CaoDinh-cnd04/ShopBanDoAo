import { Card, Button, Badge } from 'react-bootstrap';

const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => {
    return (
        <Card className={`mb-3 ${address.IsDefault ? 'border-primary' : ''}`}>
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                            <h6 className="mb-0 fw-bold">{address.ReceiverName}</h6>
                            {address.IsDefault && (
                                <Badge bg="primary" className="ms-2">Mặc định</Badge>
                            )}
                        </div>

                        <p className="mb-1">
                            <i className="bi bi-telephone me-2"></i>
                            {address.ReceiverPhone}
                        </p>

                        <p className="mb-0 text-muted">
                            <i className="bi bi-geo-alt me-2"></i>
                            {address.AddressLine}
                            {address.Ward && `, ${address.Ward}`}
                            {`, ${address.District}, ${address.City}`}
                        </p>
                    </div>

                    <div className="d-flex flex-column gap-2">
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => onEdit(address)}
                        >
                            <i className="bi bi-pencil"></i> Sửa
                        </Button>

                        {!address.IsDefault && (
                            <Button
                                size="sm"
                                variant="outline-success"
                                onClick={() => onSetDefault(address.AddressID)}
                            >
                                <i className="bi bi-star"></i> Đặt mặc định
                            </Button>
                        )}

                        <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => onDelete(address.AddressID)}
                        >
                            <i className="bi bi-trash"></i> Xóa
                        </Button>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default AddressCard;
