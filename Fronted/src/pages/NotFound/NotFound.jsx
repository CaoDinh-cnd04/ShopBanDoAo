import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiShoppingBag } from 'react-icons/fi';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="notfound-page">
      <div className="nf-blob nf-blob-1" />
      <div className="nf-blob nf-blob-2" />
      <motion.div
        className="nf-content"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="nf-code"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          404
        </motion.div>
        <h1 className="nf-title">Trang không tồn tại</h1>
        <p className="nf-sub">Trang bạn tìm không còn tồn tại hoặc đã bị xoá.</p>
        <div className="nf-actions">
          <button className="nf-btn-primary" onClick={() => navigate('/')}>
            <FiHome size={16} /> Về trang chủ
          </button>
          <button className="nf-btn-outline" onClick={() => navigate('/products')}>
            <FiShoppingBag size={16} /> Xem sản phẩm
          </button>
        </div>
      </motion.div>
    </div>
  );
};
export default NotFound;
