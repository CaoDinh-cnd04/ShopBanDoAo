import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isAdminUser } from '../../store/slices/authSlice';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
