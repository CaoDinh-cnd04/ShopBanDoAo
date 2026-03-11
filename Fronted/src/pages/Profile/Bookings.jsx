import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserBookings, cancelBooking } from '../../store/slices/bookingSlice';
import BookingCard from '../../components/Profile/BookingCard';
import EmptyState from '../../components/Profile/EmptyState';
import FilterBar from '../../components/Profile/FilterBar';
import Loading from '../../components/Loading/Loading';
import { toast } from 'react-toastify';
import { Modal, Button } from 'react-bootstrap';

const Bookings = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { bookings, isLoading } = useSelector((state) => state.bookings);

  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  useEffect(() => {
    dispatch(fetchUserBookings());
  }, [dispatch]);

  useEffect(() => {
    if (!bookings) return;

    let result = [...bookings];

    // Filter by status
    if (activeFilter !== 'all') {
      result = result.filter((booking) => {
        const status = (booking.Status || booking.status || '').toLowerCase();
        return status === activeFilter || status.includes(activeFilter);
      });
    }

    // Search
    if (searchTerm) {
      result = result.filter((booking) => {
        const courtName = (booking.court?.CourtName || booking.court?.courtName || '').toLowerCase();
        return courtName.includes(searchTerm.toLowerCase());
      });
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.BookingDate || a.bookingDate);
      const dateB = new Date(b.BookingDate || b.bookingDate);
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

    setFilteredBookings(result);
  }, [bookings, activeFilter, searchTerm, sortBy]);

  const handleCancelClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedBookingId) return;

    const result = await dispatch(cancelBooking(selectedBookingId));
    if (cancelBooking.fulfilled.match(result)) {
      toast.success('Đã hủy lịch đặt sân thành công');
    } else {
      toast.error('Không thể hủy lịch đặt sân');
    }

    setShowCancelModal(false);
    setSelectedBookingId(null);
  };

  if (isLoading) return <Loading />;

  const filterOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="bookings-page">
      <FilterBar
        onFilterChange={setActiveFilter}
        onSearchChange={setSearchTerm}
        onSortChange={setSortBy}
        filterOptions={filterOptions}
        searchPlaceholder="Tìm theo tên sân..."
      />

      {filteredBookings.length === 0 ? (
        <EmptyState type="bookings" />
      ) : (
        <div className="bookings-list">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.BookingID || booking.id}
              booking={booking}
              onCancel={handleCancelClick}
            />
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận hủy đặt sân</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn hủy lịch đặt sân này không? Hành động này không thể hoàn tác.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Đóng
          </Button>
          <Button variant="danger" onClick={handleCancelConfirm}>
            Xác nhận hủy
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Bookings;
