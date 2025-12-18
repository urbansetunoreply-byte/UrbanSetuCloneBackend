import React from 'react';
import { useSelector } from 'react-redux';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import NotFound from '../pages/NotFound';

export default function PrivateRoute({ bootstrapped }) {
  const { currentUser, loading } = useSelector((state) => state.user);
  const location = useLocation();
  // Debug log
  // console.log('PrivateRoute debug:', { bootstrapped, loading, currentUser });

  // Show loading state while Redux persist is bootstrapping or authentication is being processed
  if (!bootstrapped || loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  // Only allow users with role 'user'
  if (currentUser && currentUser.role === 'user') {
    return <Outlet />;
  }

  // If not logged in, redirect to login with callback
  if (!currentUser) {
    const redirectUrl = location.pathname + location.search;
    return <Navigate to={`/sign-in?redirect=${encodeURIComponent(redirectUrl)}`} replace />;
  }

  // If logged in but not 'user' (e.g. admin), show 404
  return <NotFound />;
}