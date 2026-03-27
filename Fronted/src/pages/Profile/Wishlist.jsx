import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart } from 'react-icons/fi';
import { fetchWishlist } from '../../store/slices/wishlistSlice';
import WishlistCard from '../../components/Profile/WishlistCard';
import Loading from '../../components/Loading/Loading';

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, isLoading } = useSelector((s) => s.wishlist);
  const safeItems = Array.isArray(items) ? items : [];

  useEffect(() => { dispatch(fetchWishlist()); }, [dispatch]);

  if (isLoading) return <Loading />;

  return (
    <div className="profile-section-card">
      <div className="profile-section-header">
        <div className="profile-section-title-row">
          <FiHeart size={20} />
          <h2 className="profile-section-title">Yêu thích</h2>
        </div>
        <p className="profile-section-sub">{safeItems.length} sản phẩm</p>
      </div>

      {safeItems.length === 0 ? (
        <div className="profile-empty-state">
          <FiHeart size={48} />
          <p>Bạn chưa có sản phẩm yêu thích. Hãy khám phá và thêm những sản phẩm bạn thích!</p>
          <button className="profile-btn-primary" onClick={() => navigate('/products')}>
            Khám phá sản phẩm
          </button>
        </div>
      ) : (
        <motion.div
          className="wishlist-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {safeItems.map((item) => (
            <WishlistCard key={item._id || item.id} item={item} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Wishlist;
