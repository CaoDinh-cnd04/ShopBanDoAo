import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { FaInbox, FaShoppingCart, FaCalendar, FaHeart } from 'react-icons/fa';
import { Button } from 'react-bootstrap';
import './EmptyState.css';

const EmptyState = ({ type, onAction }) => {
    const getConfig = () => {
        switch (type) {
            case 'orders':
                return {
                    icon: FaShoppingCart,
                    title: 'Chưa có đơn hàng nào',
                    message: 'Bạn chưa có đơn hàng nào. Hãy khám phá các sản phẩm tuyệt vời của chúng tôi!',
                    actionText: 'Mua sắm ngay',
                    actionLink: '/products',
                };
            case 'bookings':
                return {
                    icon: FaCalendar,
                    title: 'Chưa có lịch đặt sân',
                    message: 'Bạn chưa đặt sân nào. Hãy tìm và đặt sân phù hợp với bạn!',
                    actionText: 'Xem sân',
                    actionLink: '/courts',
                };
            case 'wishlist':
                return {
                    icon: FaHeart,
                    title: 'Danh sách yêu thích trống',
                    message: 'Bạn chưa có sản phẩm yêu thích nào. Hãy thêm những sản phẩm bạn thích!',
                    actionText: 'Khám phá sản phẩm',
                    actionLink: '/products',
                };
            default:
                return {
                    icon: FaInbox,
                    title: 'Không có dữ liệu',
                    message: 'Hiện tại chưa có dữ liệu để hiển thị.',
                    actionText: null,
                    actionLink: null,
                };
        }
    };

    const config = getConfig();
    const Icon = config.icon;

    return (
        <motion.div
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="empty-state-icon">
                <Icon size={64} />
            </div>
            <h4 className="empty-state-title">{config.title}</h4>
            <p className="empty-state-message">{config.message}</p>
            {config.actionText && (
                <Button
                    variant="primary"
                    onClick={() => onAction?.(config.actionLink)}
                    href={config.actionLink}
                    className="mt-3"
                >
                    {config.actionText}
                </Button>
            )}
        </motion.div>
    );
};

EmptyState.propTypes = {
    type: PropTypes.oneOf(['orders', 'bookings', 'wishlist', 'default']).isRequired,
    onAction: PropTypes.func,
};

export default EmptyState;
