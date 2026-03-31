import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';

// Layout
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';

// Pages
import Home from './pages/Home/Home';
import Products from './pages/Products/Products';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Courts from './pages/Courts/Courts';
import CourtDetail from './pages/CourtDetail/CourtDetail';
import Booking from './pages/Booking/Booking';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Profile/Profile';
import OrderDetail from './pages/Profile/OrderDetail';
import BookingDetail from './pages/Profile/BookingDetail';
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminProductForm from './pages/Admin/AdminProductForm';
import AdminCategories from './pages/Admin/AdminCategories';
import AdminCourts from './pages/Admin/AdminCourts';
import AdminVouchers from './pages/Admin/AdminVouchers';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminBookings from './pages/Admin/AdminBookings';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminUserDetail from './pages/Admin/AdminUserDetail';
import AdminReviews from './pages/Admin/AdminReviews';
import AdminBanner from './pages/Admin/AdminBanner';
import About from './pages/About/About';
import Contact from './pages/Contact/Contact';
import FAQ from './pages/FAQ/FAQ';
import Shipping from './pages/Shipping/Shipping';
import Privacy from './pages/Privacy/Privacy';
import Terms from './pages/Terms/Terms';
import NotFound from './pages/NotFound/NotFound';

// Redux
import { checkAuth } from './store/slices/authSlice';
import { setTheme } from './store/slices/themeSlice';

// Components
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground';

function App() {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.theme);

  useEffect(() => {
    // Check authentication on mount
    dispatch(checkAuth());
    // Load cart from localStorage
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    dispatch(setTheme(savedTheme));
  }, [dispatch]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app" data-theme={theme}>
      <AnimatedBackground />
      <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="courts" element={<Courts />} />
            <Route path="courts/:id" element={<CourtDetail />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="shipping" element={<Shipping />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />

            {/* Protected Routes */}
            <Route
              path="cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="booking/:courtId"
              element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              }
            />
            {/* Profile — tất cả sub-tabs render trong Profile layout với sidebar */}
            <Route
              path="profile"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route
              path="profile/orders"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route
              path="profile/bookings"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route
              path="profile/wishlist"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route
              path="profile/addresses"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route
              path="profile/vouchers"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route
              path="profile/password"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route
              path="profile/notifications"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            {/* Detail pages — standalone */}
            <Route
              path="profile/orders/:id"
              element={<ProtectedRoute><OrderDetail /></ProtectedRoute>}
            />
            <Route
              path="profile/bookings/:id"
              element={<ProtectedRoute><BookingDetail /></ProtectedRoute>}
            />

            {/* 404 cho trang chủ */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin: giao diện riêng, không dùng Layout (Navbar/Footer) site chính */}
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="courts" element={<AdminCourts />} />
            <Route path="vouchers" element={<AdminVouchers />} />
            <Route path="voucher" element={<Navigate to="/admin/vouchers" replace />} />
            <Route path="users/:id" element={<AdminUserDetail />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="banner" element={<AdminBanner />} />
          </Route>
        </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </div>
  );
}

export default App;
