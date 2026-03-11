import PropTypes from 'prop-types';
import { Badge } from 'react-bootstrap';
import {
    FaCheckCircle,
    FaClock,
    FaTruck,
    FaTimesCircle,
    FaBoxOpen,
    FaCalendarCheck
} from 'react-icons/fa';

const StatusBadge = ({ status, type = 'order' }) => {
    const getStatusConfig = () => {
        if (type === 'order') {
            switch (status?.toLowerCase()) {
                case 'pending':
                case 'chờ xác nhận':
                    return { bg: 'warning', icon: FaClock, text: 'Chờ xác nhận' };
                case 'confirmed':
                case 'đã xác nhận':
                    return { bg: 'info', icon: FaCheckCircle, text: 'Đã xác nhận' };
                case 'shipping':
                case 'đang giao':
                    return { bg: 'primary', icon: FaTruck, text: 'Đang giao' };
                case 'delivered':
                case 'đã giao':
                    return { bg: 'success', icon: FaBoxOpen, text: 'Đã giao' };
                case 'cancelled':
                case 'đã hủy':
                    return { bg: 'danger', icon: FaTimesCircle, text: 'Đã hủy' };
                default:
                    return { bg: 'secondary', icon: FaClock, text: status };
            }
        } else if (type === 'booking') {
            switch (status?.toLowerCase()) {
                case 'pending':
                case 'chờ xác nhận':
                    return { bg: 'warning', icon: FaClock, text: 'Chờ xác nhận' };
                case 'confirmed':
                case 'đã xác nhận':
                    return { bg: 'success', icon: FaCalendarCheck, text: 'Đã xác nhận' };
                case 'completed':
                case 'hoàn thành':
                    return { bg: 'info', icon: FaCheckCircle, text: 'Hoàn thành' };
                case 'cancelled':
                case 'đã hủy':
                    return { bg: 'danger', icon: FaTimesCircle, text: 'Đã hủy' };
                default:
                    return { bg: 'secondary', icon: FaClock, text: status };
            }
        }
        return { bg: 'secondary', icon: FaClock, text: status };
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <Badge bg={config.bg} className="d-inline-flex align-items-center gap-1">
            <Icon size={12} />
            <span>{config.text}</span>
        </Badge>
    );
};

StatusBadge.propTypes = {
    status: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['order', 'booking', 'payment']),
};

export default StatusBadge;
