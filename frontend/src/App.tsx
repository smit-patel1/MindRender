import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './contexts/AuthProvider';
import Home from './pages/Home';
import Demo from './pages/Demo';
import Profile from './pages/Profile';
import LearnMore from './pages/LearnMore';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import ManageSubscription from './pages/ManageSubscription';
import SimFrame from './pages/SimFrame';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
    const { user, loading } = useAuth();

  useEffect(() => {
    // Don't redirect while auth is loading or during auth callback
    if (loading || location.pathname === '/auth/callback') {
      return;
    }

      const currentPath = location.pathname;
      const isPublicRoute = ['/'].includes(currentPath);
      const isAuthRoute = ['/auth', '/login'].includes(currentPath);
      const isProtectedRoute = ['/demo', '/profile', '/manage-subscription'].includes(currentPath);

    if (user) {
      // Authenticated user accessing public-only routes should go to profile
        if (isPublicRoute || isAuthRoute) {
          navigate('/profile', { replace: true });
        }
      } else {
        // Unauthenticated user accessing protected routes should go to auth
        if (isProtectedRoute) {
          navigate(`/login?redirectTo=${encodeURIComponent(currentPath)}`, { replace: true });
        }
      }
    }, [user, loading, location.pathname, navigate]);

  return (
    <div className="min-h-screen">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/manage-subscription" element={<ManageSubscription />} />
          <Route path="/learn" element={<LearnMore />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/sim-frame" element={<SimFrame />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;