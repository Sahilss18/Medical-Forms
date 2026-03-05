import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.some(role => role.toUpperCase() === user.role.toUpperCase())) {
    // Redirect to appropriate dashboard based on role
    // Handle both uppercase (backend) and lowercase (frontend) role formats
    const roleRedirects: Record<string, string> = {
      APPLICANT: '/applicant/dashboard',
      INSPECTOR: '/inspector/dashboard',
      OFFICER: '/officer/dashboard',
      ADMIN: '/admin/dashboard',
      applicant: '/applicant/dashboard',
      inspector: '/inspector/dashboard',
      officer: '/officer/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={roleRedirects[user.role]} replace />;
  }

  return <>{children}</>;
};
