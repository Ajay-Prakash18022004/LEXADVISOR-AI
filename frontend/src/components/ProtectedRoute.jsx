import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, token, switchPortal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // If navigating to an advocate route but user is client (or vice versa), auto-switch the role seamlessly
    if (allowedRole && user && user.role !== allowedRole && switchPortal) {
      switchPortal(allowedRole);
    }
  }, [allowedRole, user?.role, switchPortal]);

  if (!user && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

