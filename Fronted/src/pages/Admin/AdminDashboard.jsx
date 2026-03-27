import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Row, Col, Spinner, Card, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  FiUsers,
  FiShoppingCart,
  FiDollarSign,
  FiCalendar,
  FiMapPin,
  FiTag,
  FiStar,
  FiArrowRight
} from 'react-icons/fi';
import StatCard from '../../components/Admin/StatCard';
import RevenueChart from '../../components/Admin/RevenueChart';
import TopProducts from '../../components/Admin/TopProducts';
import adminService from '../../services/adminService';

const quickLinks = [
  { to: '/admin/orders', label: 'Đơn hàng', icon: FiShoppingCart },
  {
    to: `/admin/orders?status=${encodeURIComponent('Chờ xử lý')}`,
    label: 'Đơn chờ xử lý',
    icon: FiShoppingCart
  },
  { to: '/admin/bookings', label: 'Đặt sân', icon: FiCalendar },
  {
    to: `/admin/bookings?status=${encodeURIComponent('Chờ xác nhận')}`,
    label: 'Đặt chờ xác nhận',
    icon: FiCalendar
  },
  { to: '/admin/courts', label: 'Sân', icon: FiMapPin },
  { to: '/admin/vouchers', label: 'Voucher', icon: FiTag },
  { to: '/admin/reviews', label: 'Đánh giá', icon: FiStar },
  { to: '/admin/users', label: 'Người dùng', icon: FiUsers }
];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await adminService.dashboard.getDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Không thể tải dữ liệu dashboard');
        toast.error('Lỗi khi tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const vm = useMemo(() => {
    const users = stats?.users || {};
    const orders = stats?.orders || {};
    const bookings = stats?.bookings || {};
    const courts = stats?.courts || {};
    const vouchers = stats?.vouchers || {};
    const reviews = stats?.reviews || {};

    const userOverview = users.overview || users;
    const orderOverview = orders.overview || orders;
    const bookingOverview = bookings.overview || bookings;

    const totalUsers = userOverview.TotalUsers ?? userOverview.totalUsers ?? 0;
    const newUsersThisMonth = userOverview.NewUsersThisMonth ?? userOverview.newUsersThisMonth ?? 0;

    const totalOrders = orderOverview.TotalOrders ?? orderOverview.totalOrders ?? 0;
    const pendingOrders = orderOverview.PendingOrders ?? orderOverview.pendingOrders ?? 0;
    const totalRevenue = orderOverview.TotalRevenue ?? orderOverview.totalRevenue ?? 0;

    const totalBookings = bookingOverview.TotalBookings ?? bookingOverview.totalBookings ?? 0;
    const pendingBookings = bookingOverview.PendingBookings ?? bookingOverview.pendingBookings ?? 0;

    const totalCourts = courts.totalCourts ?? 0;
    const activeCourts = courts.activeCourts ?? 0;
    const courtBookingsTotal = courts.totalBookings ?? 0;

    const totalVouchers = vouchers.totalVouchers ?? 0;
    const activeVouchers = vouchers.activeVouchers ?? 0;

    const pendingReviews =
      reviews.pendingTotal ??
      (reviews.pendingProductReviews ?? 0) + (reviews.pendingCourtReviews ?? 0);
    const totalReviewCount =
      (reviews.totalProductReviews ?? 0) + (reviews.totalCourtReviews ?? 0);

    return {
      totalUsers,
      newUsersThisMonth,
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalBookings,
      pendingBookings,
      revenueByDay: orders.revenueByDay || orders.revenueByDay30 || [],
      topProducts: orders.topProducts || [],
      totalCourts,
      activeCourts,
      courtBookingsTotal,
      totalVouchers,
      activeVouchers,
      pendingReviews,
      totalReviewCount
    };
  }, [stats]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tổng quan</h1>
          <div className="admin-page-subtitle">
            Tóm tắt người dùng, đơn hàng, đặt sân, sân, voucher và đánh giá.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-panel" style={{ padding: 24, textAlign: 'center' }}>
          <Spinner animation="border" />
          <div className="admin-loading-hint">Đang tải dữ liệu…</div>
        </div>
      ) : error ? (
        <Alert variant="danger" className="mb-0">
          {error}
        </Alert>
      ) : (
        <>
          <Row className="g-3 mb-1">
            <Col md={6} xl={3}>
              <StatCard
                title="Người dùng"
                value={vm.totalUsers}
                icon={FiUsers}
                color="indigo"
                trend="up"
                trendValue={`${vm.newUsersThisMonth} mới trong tháng`}
              />
            </Col>
            <Col md={6} xl={3}>
              <StatCard
                title="Đơn hàng"
                value={vm.totalOrders}
                icon={FiShoppingCart}
                color="green"
                trend="up"
                trendValue={`${vm.pendingOrders} chờ xử lý`}
              />
            </Col>
            <Col md={6} xl={3}>
              <StatCard
                title="Doanh thu"
                value={new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(
                  vm.totalRevenue
                )}
                icon={FiDollarSign}
                color="amber"
              />
            </Col>
            <Col md={6} xl={3}>
              <StatCard
                title="Đặt sân"
                value={vm.totalBookings}
                icon={FiCalendar}
                color="surface"
                trend="up"
                trendValue={`${vm.pendingBookings} chờ xác nhận`}
              />
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            <Col md={6} xl={4}>
              <StatCard
                title="Sân"
                value={vm.activeCourts}
                icon={FiMapPin}
                color="indigo"
                trend="up"
                trendValue={`${vm.totalCourts} tổng · ${vm.courtBookingsTotal} lượt đặt`}
              />
            </Col>
            <Col md={6} xl={4}>
              <StatCard
                title="Voucher hiệu lực"
                value={vm.activeVouchers}
                icon={FiTag}
                color="green"
                trend="up"
                trendValue={`${vm.totalVouchers} mã trong hệ thống`}
              />
            </Col>
            <Col md={12} xl={4}>
              <StatCard
                title="Đánh giá chờ duyệt"
                value={vm.pendingReviews}
                icon={FiStar}
                color="amber"
                trend="up"
                trendValue={`${vm.totalReviewCount} đánh giá tổng`}
              />
            </Col>
          </Row>

          <Card className="admin-panel mb-3">
            <Card.Body className="admin-panel-body">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <div className="fw-bold text-dark">Truy cập nhanh</div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {quickLinks.map(({ to, label, icon: Icon }) => (
                  <Button
                    key={to}
                    as={Link}
                    to={to}
                    variant="outline-primary"
                    className="d-inline-flex align-items-center gap-2 admin-quick-link"
                  >
                    <Icon size={16} />
                    {label}
                    <FiArrowRight size={14} className="opacity-75" />
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>

          <RevenueChart data={vm.revenueByDay || []} />
          <TopProducts products={vm.topProducts || []} />
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
