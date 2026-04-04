import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';

// Layout + guards — load ngay (nhỏ, cần luôn)
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import Loading from './components/Loading/Loading';

// Redux
import { checkAuth } from './store/slices/authSlice';
import { setTheme } from './store/slices/themeSlice';

// Components
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground';
import { disconnectChatSocket } from './services/chatSocket';

// ── Lazy pages ────────────────────────────────────────────────
// Public
const Home            = lazy(() => import('./pages/Home/Home'));
const Products        = lazy(() => import('./pages/Products/Products'));
const ProductDetail   = lazy(() => import('./pages/ProductDetail/ProductDetail'));
const Courts          = lazy(() => import('./pages/Courts/Courts'));
const CourtDetail     = lazy(() => import('./pages/CourtDetail/CourtDetail'));
const Login           = lazy(() => import('./pages/Auth/Login'));
const Register        = lazy(() => import('./pages/Auth/Register'));
const AuthGoogleCallback = lazy(() => import('./pages/Auth/AuthGoogleCallback'));
const About           = lazy(() => import('./pages/About/About'));
const Contact         = lazy(() => import('./pages/Contact/Contact'));
const FAQ             = lazy(() => import('./pages/FAQ/FAQ'));
const Shipping        = lazy(() => import('./pages/Shipping/Shipping'));
const Privacy         = lazy(() => import('./pages/Privacy/Privacy'));
const Terms           = lazy(() => import('./pages/Terms/Terms'));
const NotFound        = lazy(() => import('./pages/NotFound/NotFound'));

// Protected
const Cart            = lazy(() => import('./pages/Cart/Cart'));
const Checkout        = lazy(() => import('./pages/Checkout/Checkout'));
const Booking         = lazy(() => import('./pages/Booking/Booking'));
const Profile         = lazy(() => import('./pages/Profile/Profile'));
const OrderDetail     = lazy(() => import('./pages/Profile/OrderDetail'));
const BookingDetail   = lazy(() => import('./pages/Profile/BookingDetail'));

// Admin — chunk riêng, user thường không load
const AdminLayout     = lazy(() => import('./components/Admin/AdminLayout'));
const AdminDashboard  = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminProducts   = lazy(() => import('./pages/Admin/AdminProducts'));
const AdminProductForm = lazy(() => import('./pages/Admin/AdminProductForm'));
const AdminCategories = lazy(() => import('./pages/Admin/AdminCategories'));
const AdminCourts     = lazy(() => import('./pages/Admin/AdminCourts'));
const AdminVouchers   = lazy(() => import('./pages/Admin/AdminVouchers'));
const AdminOrders     = lazy(() => import('./pages/Admin/AdminOrders'));
const AdminBookings   = lazy(() => import('./pages/Admin/AdminBookings'));
const AdminUsers      = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminUserDetail = lazy(() => import('./pages/Admin/AdminUserDetail'));
const AdminReviews    = lazy(() => import('./pages/Admin/AdminReviews'));
const AdminBanner     = lazy(() => import('./pages/Admin/AdminBanner'));
const AdminPromos     = lazy(() => import('./pages/Admin/AdminPromos'));
const AdminMessages   = lazy(() => import('./pages/Admin/AdminMessages'));

function App() {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.theme);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) disconnectChatSocket();
  }, [token]);

  useEffect(() => {
    dispatch(checkAuth());
    const savedTheme = localStorage.getItem('theme') || 'light';
    dispatch(setTheme(savedTheme));
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app" data-theme={theme}>
      <AnimatedBackground />
      <Suspense fallback={<Loading />}>
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
            <Route path="auth/google/callback" element={<AuthGoogleCallback />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="shipping" element={<Shipping />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />

            {/* Protected Routes */}
            <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="booking/:courtId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="profile/orders" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="profile/bookings" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="profile/wishlist" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="profile/addresses" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="profile/vouchers" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="profile/password" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="profile/notifications" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="profile/messages" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="profile/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
            <Route path="profile/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin: giao diện riêng */}
          <Route
            path="admin"
            element={<AdminRoute><AdminLayout /></AdminRoute>}
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
            <Route path="promos" element={<AdminPromos />} />
            <Route path="messages" element={<AdminMessages />} />
          </Route>
        </Routes>
      </Suspense>

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
