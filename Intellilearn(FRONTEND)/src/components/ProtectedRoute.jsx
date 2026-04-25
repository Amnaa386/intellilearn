import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const isLoggedIn = localStorage.getItem('intellilearn_isLoggedIn') === 'true';
  const userRole = localStorage.getItem('intellilearn_role');
  const userRaw = localStorage.getItem('intellilearn_user');
  const backendVerifiedAdmin = localStorage.getItem('intellilearn_admin_backend_verified') === 'true';
  const authorizedAdminEmail = (import.meta.env.VITE_ADMIN_AUTHORIZED_EMAIL || '').trim().toLowerCase();

  let userEmail = '';
  try {
    userEmail = userRaw ? JSON.parse(userRaw)?.email?.toLowerCase() || '' : '';
  } catch {
    userEmail = '';
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth/login" replace />;
  }

  if (role === 'admin') {
    const isAuthorizedAdmin =
      userRole === 'admin' &&
      backendVerifiedAdmin &&
      Boolean(authorizedAdminEmail) &&
      userEmail === authorizedAdminEmail;

    if (!isAuthorizedAdmin) {
      localStorage.removeItem('intellilearn_role');
      localStorage.removeItem('intellilearn_admin_backend_verified');
      return <Navigate to="/auth/login" replace />;
    }
  }

  if (role && userRole !== role) {
    // Redirect to correct dashboard based on role
    const dashboardPath = '/dashboard/student';
    return <Navigate to={dashboardPath} replace />;
  }
  return children;
}
