import { useEffect, useMemo, useState } from 'react';
import { Alert, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FiUsers, FiShoppingCart, FiDollarSign, FiCalendar } from 'react-icons/fi';
import StatCard from '../../components/Admin/StatCard';
import RevenueChart from '../../components/Admin/RevenueChart';
import TopProducts from '../../components/Admin/TopProducts';
import adminService from '../../services/adminService';

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
    };
  }, [stats]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tổng quan</h1>
          <div className="admin-page-subtitle">Tóm tắt nhanh tình hình đơn hàng, người dùng và đặt sân.</div>
        </div>
      </div>

      {loading ? (
        <div className="admin-panel" style={{ padding: 24, textAlign: 'center' }}>
          <Spinner animation="border" />
          <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.62)' }}>Đang tải dữ liệu…</div>
        </div>
      ) : error ? (
        <Alert variant="danger" className="mb-0">
          {error}
        </Alert>
      ) : (
        <>
          <Row className="g-3">
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
                value={new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(vm.totalRevenue)}
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

          <RevenueChart data={vm.revenueByDay || []} />
          <TopProducts products={vm.topProducts || []} />
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
