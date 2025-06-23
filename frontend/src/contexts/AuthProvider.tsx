import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  withValidSession: (operation: () => Promise<any>) => Promise<any>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider. Make sure your component is wrapped with <AuthProvider>.');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Force session refresh
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('AuthProvider: Attempting to refresh session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('AuthProvider: Session refresh failed:', error.message);
        setError(error.message);
        return false;
      }
      
      if (data.session) {
        console.log('AuthProvider: Session refreshed successfully');
        setSession(data.session);
        setUser(data.session.user);
        setError(null);
        return true;
      }
      
      console.log('AuthProvider: No session returned from refresh');
      return false;
    } catch (error) {
      console.error('AuthProvider: Session refresh error:', error);
      setError('Session refresh failed');
      return false;
    }
  }, []);

  // Validate current session
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('AuthProvider: Validating current session...');
      
      // First check if we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('AuthProvider: Session validation error:', sessionError.message);
        setError(sessionError.message);
        return false;
      }

      if (!session) {
        console.log('AuthProvider: No session found during validation');
        setUser(null);
        setSession(null);
        return false;
      }

      // Check if session is close to expiry
      const expiresAt = session.expires_at;
      if (expiresAt !== undefined) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;
        
        if (timeUntilExpiry < 300) { // Less than 5 minutes
          console.log('AuthProvider: Session expiring soon, attempting refresh...');
          return await refreshSession();
        }
      }

      // Validate session with getUser
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('AuthProvider: User validation failed:', userError.message);
          
          if (userError.message?.includes('Auth session missing')) {
            console.log('AuthProvider: Session missing, clearing auth state');
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            return false;
          }
          
          setError(userError.message);
          return false;
        }

        if (user) {
          console.log('AuthProvider: Session validated successfully for user:', user.email);
          setUser(user);
          setSession(session);
          setError(null);
          return true;
        }

        console.log('AuthProvider: No user found despite valid session');
        return false;
      } catch (authError: any) {
        console.error('AuthProvider: Auth validation error:', authError);
        
        if (authError.message?.includes('Auth session missing')) {
          console.log('AuthProvider: Auth session missing, signing out');
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
        }
        
        setError('Authentication validation failed');
        return false;
      }
    } catch (error) {
      console.error('AuthProvider: Session validation failed:', error);
      setError('Session validation failed');
      return false;
    }
  }, [refreshSession]);

  // Safe session operation wrapper
  const withValidSession = useCallback(async (operation: () => Promise<any>) => {
    console.log('AuthProvider: Executing operation with session validation...');
    
    const isValid = await validateSession();
    if (!isValid) {
      const errorMsg = 'Session invalid or expired';
      console.error('AuthProvider:', errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
    
    try {
      const result = await operation();
      console.log('AuthProvider: Operation completed successfully');
      return result;
    } catch (error) {
      console.error('AuthProvider: Operation failed:', error);
      throw error;
    }
  }, [validateSession]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      console.log('AuthProvider: Starting sign out process...');
      console.log('AuthProvider: Current user before sign out:', user?.email || 'No user');
      
      // Clear state immediately for responsive UI
      setUser(null);
      setSession(null);
      setError(null);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthProvider: Sign out failed:', error.message);
        setError('Sign out failed: ' + error.message);
        return;
      }
      
      console.log('AuthProvider: Sign out successful');
      
      // Force full page reload to clear any remaining state
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('AuthProvider: Unexpected error during sign out:', error);
      setError('Sign out failed: ' + error.message);
    }
  }, [user]);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Initializing authentication...');
        setLoading(true);
        setError(null);

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Initial session error:', error.message);
          setError(error.message);
          setLoading(false);
          return;
        }

        if (session) {
          console.log('AuthProvider: Initial session found for user:', session.user.email);
          setUser(session.user);
          setSession(session);
        } else {
          console.log('AuthProvider: No initial session found');
          setUser(null);
          setSession(null);
        }

        setLoading(false);

        // Set up periodic session validation (every 2 minutes)
        refreshInterval = setInterval(async () => {
          console.log('AuthProvider: Periodic session validation...');
          await validateSession();
        }, 120000); // 2 minutes

      } catch (error) {
        console.error('AuthProvider: Auth initialization failed:', error);
        setError('Authentication initialization failed');
        setLoading(false);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, session?.user ? `User: ${session.user.email}` : 'No user');
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('AuthProvider: User signed out or session ended');
          setUser(null);
          setSession(null);
          setError(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('AuthProvider: User signed in:', session.user.email);
          setUser(session.user);
          setSession(session);
          setError(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('AuthProvider: Token refreshed for user:', session.user.email);
          setUser(session.user);
          setSession(session);
          setError(null);
        } else if (session?.user) {
          console.log('AuthProvider: Session updated for user:', session.user.email);
          setUser(session.user);
          setSession(session);
          setError(null);
        }
      }
    );

    initializeAuth();

    // Cleanup
    return () => {
      console.log('AuthProvider: Cleaning up auth subscription and intervals');
      if (refreshInterval) clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, [validateSession]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    withValidSession,
    signOut,
    refreshSession
  };

  console.log('AuthProvider: Rendering with state:', { 
    hasUser: !!user, 
    hasSession: !!session, 
    loading, 
    error: error || 'none' 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}