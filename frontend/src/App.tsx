import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import { useAuth } from './contexts/AuthProvider';
import Home from './pages/Home';
import Demo from './pages/Demo';
import Profile from './pages/Profile';
import LearnMore from './pages/LearnMore';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import ManageSubscription from './pages/ManageSubscription';

// Layout component that includes the navbar for specific pages
function LayoutWithNavbar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

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
    const isAuthRoute = currentPath === '/auth';
    const isProtectedRoute = ['/demo', '/profile', '/manage-subscription'].includes(currentPath);

    if (user) {
      // Authenticated user accessing public-only routes should go to profile
      if (isPublicRoute || isAuthRoute) {
        console.log('Redirecting authenticated user from', currentPath, 'to /profile');
        navigate('/profile', { replace: true });
      }
    } else {
      // Unauthenticated user accessing protected routes should go to auth
      if (isProtectedRoute) {
        console.log('Redirecting unauthenticated user from', currentPath, 'to /auth');
        navigate('/auth', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);

  return (
    <div className="min-h-screen">
      <ErrorBoundary>
        <Routes>
          {/* Routes with navbar */}
          <Route path="/" element={<LayoutWithNavbar><Home /></LayoutWithNavbar>} />
          <Route path="/profile" element={<LayoutWithNavbar><Profile /></LayoutWithNavbar>} />
          <Route path="/manage-subscription" element={<LayoutWithNavbar><ManageSubscription /></LayoutWithNavbar>} />
          <Route path="/learn" element={<LayoutWithNavbar><LearnMore /></LayoutWithNavbar>} />
          <Route path="/auth" element={<LayoutWithNavbar><Auth /></LayoutWithNavbar>} />
          <Route path="/auth/callback" element={<LayoutWithNavbar><AuthCallback /></LayoutWithNavbar>} />
          
          {/* Routes without navbar */}
          <Route path="/demo" element={<Demo />} />
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