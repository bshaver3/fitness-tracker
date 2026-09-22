import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading, profileComplete } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="route-loading" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        Loading FitTrack…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If profile is not complete and we're not already on the profile page, redirect
  if (!profileComplete && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

export default ProtectedRoute;
