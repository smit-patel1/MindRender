import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Processing OAuth callback...');
        
        // Get session from URL parameters
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthCallback: Session error:', error);
          throw new Error(`Authentication failed: ${error.message}`);
        }

        if (data.session?.user) {
          console.log('AuthCallback: Session successfully restored for user:', data.session.user.email);
          setStatus('success');
          
          // Clear any OAuth parameters from URL
          const cleanUrl = `${window.location.origin}/auth/callback`;
          window.history.replaceState({}, document.title, cleanUrl);
          
          // Redirect immediately to profile
          navigate('/profile', { replace: true });
          
        } else {
          console.log('AuthCallback: No session found, checking URL parameters...');
          
          // If no session but we have URL parameters, wait for Supabase to process them
          const urlParams = new URLSearchParams(window.location.search);
          const hasAuthParams = urlParams.has('code') || urlParams.has('access_token');
          
          if (hasAuthParams) {
            // Wait a bit for Supabase to process the auth callback
            setTimeout(async () => {
              const { data: retryData, error: retryError } = await supabase.auth.getSession();
              
              if (retryError || !retryData.session) {
                throw new Error('Failed to establish session after OAuth callback');
              }
              
              console.log('AuthCallback: Session established on retry for user:', retryData.session.user.email);
              setStatus('success');
              
              navigate('/profile', { replace: true });
            }, 2000);
          } else {
            throw new Error('No authentication data found');
          }
        }
        
      } catch (error: any) {
        console.error('AuthCallback: Authentication callback failed:', error);
        setError(error.message || 'Authentication failed');
        setStatus('error');
        
        // Redirect to auth page after showing error
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

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