import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserOrders } from '../../store/slices/orderSlice';
import OrderCard from '../../components/Profile/OrderCard';
import EmptyState from '../../components/Profile/EmptyState';
import FilterBar from '../../components/Profile/FilterBar';
import Loading from '../../components/Loading/Loading';

const Orders = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { orders, isLoading } = useSelector((state) => state.orders);

  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    dispatch(fetchUserOrders());
  }, [dispatch]);

  useEffect(() => {
    if (!orders) return;

    let result = [...orders];

    // Filter by status
    if (activeFilter !== 'all') {
      result = result.filter((order) => {
        const status = (order.Status || order.status || '').toLowerCase();
        return status === activeFilter || status.includes(activeFilter);
      });
    }

    // Search
    if (searchTerm) {
      result = result.filter((order) => {
        const orderId = String(order.OrderID || order.id);
        return orderId.includes(searchTerm);
      });
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.OrderDate || a.orderDate);
      const dateB = new Date(b.OrderDate || b.orderDate);
      const amountA = a.TotalAmount || a.totalAmount || 0;
      const amountB = b.TotalAmount || b.totalAmount || 0;

      switch (sortBy) {
        case 'newest':
          return dateB - dateA;
        case 'oldest':
          return dateA - dateB;
        case 'price-high':
          return amountB - amountA;
        case 'price-low':
          return amountA - amountB;
        default:
          return 0;
      }
    });

    setFilteredOrders(result);
  }, [orders, activeFilter, searchTerm, sortBy]);

  if (isLoading) return <Loading />;

  const filterOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipping', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="orders-page">
      <FilterBar
        onFilterChange={setActiveFilter}
        onSearchChange={setSearchTerm}
        onSortChange={setSortBy}
        filterOptions={filterOptions}
        searchPlaceholder="Tìm theo mã đơn hàng..."
      />

      {filteredOrders.length === 0 ? (
        <EmptyState type="orders" />
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <OrderCard key={order.OrderID || order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
