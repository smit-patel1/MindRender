import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If we have a user, authentication was successful
    if (user) {
      console.log('AuthCallback: Authentication successful for user:', user.email);
      setStatus('success');
      
      // Navigate to profile after a brief delay to show success state
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 1500);
      
      return;
    }

    // If no user and auth is not loading, authentication failed
    console.log('AuthCallback: Authentication failed - no user found');
    setStatus('error');
    setError('Authentication failed. Please try again.');
    
    // Redirect to auth page after showing error
    setTimeout(() => {
      navigate('/auth', { replace: true });
    }, 3000);

  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">Completing Sign In</h1>
            <p className="text-gray-300">
              Please wait while we complete your authentication...
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">Sign In Successful!</h1>
            <p className="text-gray-300">
              Redirecting you to your profile...
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-4">Sign In Failed</h1>
            <p className="text-gray-300 mb-4">
              {error || 'An unexpected error occurred during authentication.'}
            </p>
            <p className="text-sm text-gray-400">
              Redirecting you back to the login page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}