import { Card, Button, Badge } from 'react-bootstrap';

const VoucherCard = ({ voucher, onCollect, collected = false }) => {
    const isExpired = new Date(voucher.EndDate) < new Date();
    const isNotStarted = new Date(voucher.StartDate) > new Date();
    const isAvailable = !isExpired && !isNotStarted && voucher.IsActive;

    const getDiscountText = () => {
        if (voucher.DiscountType === 'Phần trăm') {
            return `-${voucher.DiscountValue}%`;
        }
        return `-${new Intl.NumberFormat('vi-VN').format(voucher.DiscountValue)}đ`;
    };

    const getStatus = () => {
        if (isExpired) return { text: 'Hết hạn', variant: 'secondary' };
        if (isNotStarted) return { text: 'Sắp diễn ra', variant: 'info' };
        if (!voucher.IsActive) return { text: 'Không khả dụng', variant: 'secondary' };
        if (collected) return { text: 'Đã nhận', variant: 'success' };
        return { text: 'Khả dụng', variant: 'primary' };
    };

    const status = getStatus();

    return (
        <Card className="h-100 shadow-sm voucher-card">
            <Card.Body className="d-flex">
                {/* Left side - Discount */}
                <div className="voucher-discount text-center p-3 bg-primary text-white rounded">
                    <h2 className="fw-bold mb-0">{getDiscountText()}</h2>
                    <small>Giảm giá</small>
                </div>

                {/* Right side - Details */}
                <div className="flex-grow-1 ps-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0">{voucher.VoucherName}</h6>
                        <Badge bg={status.variant}>{status.text}</Badge>
                    </div>

                    <p className="text-muted small mb-2">{voucher.Description}</p>

                    <div className="small mb-2">
                        <div>
                            <i className="bi bi-tag me-2"></i>
                            Mã: <strong>{voucher.VoucherCode}</strong>
                        </div>
                        {voucher.MinOrderAmount > 0 && (
                            <div>
                                <i className="bi bi-cart me-2"></i>
                                Đơn tối thiểu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(voucher.MinOrderAmount)}
                            </div>
                        )}
                        {voucher.MaxDiscountAmount && (
                            <div>
                                <i className="bi bi-cash me-2"></i>
                                Giảm tối đa: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(voucher.MaxDiscountAmount)}
                            </div>
                        )}
                        <div>
                            <i className="bi bi-calendar me-2"></i>
                            HSD: {new Date(voucher.EndDate).toLocaleDateString('vi-VN')}
                        </div>
                    </div>

                    {isAvailable && !collected && onCollect && (
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={() => onCollect(voucher.VoucherCode)}
                        >
                            <i className="bi bi-plus-circle me-1"></i>
                            Nhận voucher
                        </Button>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default VoucherCard;
