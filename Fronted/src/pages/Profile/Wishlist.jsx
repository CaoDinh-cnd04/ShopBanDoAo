import { useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist } from '../../store/slices/wishlistSlice';
import WishlistCard from '../../components/Profile/WishlistCard';
import EmptyState from '../../components/Profile/EmptyState';
import Loading from '../../components/Loading/Loading';

const Wishlist = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  if (isLoading) return <Loading />;

  if (!items || items.length === 0) {
    return <EmptyState type="wishlist" />;
  }

  return (
    <div className="wishlist-page">
      <Row className="g-4">
        {Array.isArray(items) && items.map((item) => (
          <Col lg={3} md={4} sm={6} key={item.wishlistItemId ?? item.WishlistItemID ?? item.id}>
            <WishlistCard item={item} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Wishlist;
