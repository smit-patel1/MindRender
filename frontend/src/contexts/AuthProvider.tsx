import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'user' | 'dev';
  loading: boolean;
  error: string | null;
  withValidSession: <T>(operation: () => Promise<T>) => Promise<T>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider');
    throw new Error(
      'useAuth must be used within an AuthProvider. Make sure your component is wrapped with <AuthProvider>.',
    );
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'user' | 'dev'>('user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single();
    setRole(data?.role === 'dev' ? 'dev' : 'user');
  }, []);

  // Force session refresh
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('AuthProvider: Session refresh failed:', error.message);
        setError(error.message);
        return false;
      }

        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          await fetchRole(data.session.user.id);
          setError(null);
          return true;
        }
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
      // First check if we have a session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          'AuthProvider: Session validation error:',
          sessionError.message,
        );
        setError(sessionError.message);
        return false;
      }

      if (!session) {
        setUser(null);
        setSession(null);
        return false;
      }

      // Check if session is close to expiry
      const expiresAt = session.expires_at;
      if (expiresAt !== undefined) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        if (timeUntilExpiry < 300) {
          // Less than 5 minutes
          return await refreshSession();
        }
      }

      // Validate session with getUser
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            'AuthProvider: User validation failed:',
            userError.message,
          );

          if (userError.message?.includes('Auth session missing')) {
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            return false;
          }

          setError(userError.message);
          return false;
        }

        if (user) {
          setUser(user);
          setSession(session);
          await fetchRole(user.id);
          setError(null);
          return true;
        }
        return false;
      } catch (authError: unknown) {
        console.error('AuthProvider: Auth validation error:', authError);

        if (
          authError instanceof Error &&
          authError.message?.includes('Auth session missing')
        ) {
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
  const withValidSession = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      const isValid = await validateSession();
      if (!isValid) {
        const errorMsg = 'Session invalid or expired';
        console.error('AuthProvider:', errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      try {
        const result = await operation();
        return result;
      } catch (error) {
        console.error('AuthProvider: Operation failed:', error);
        throw error;
      }
    },
    [validateSession],
  );

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      // Clear state immediately for responsive UI
      setUser(null);
      setSession(null);
      setRole('user');
      setError(null);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        if (error.message?.includes('Auth session missing')) {
          window.location.href = '/';
        } else {
          console.error('AuthProvider: Sign out failed:', error.message);
          setError('Sign out failed: ' + error.message);
          return;
        }
      }

      window.location.href = '/';
    } catch (error: unknown) {
      console.error('AuthProvider: Unexpected error during sign out:', error);

      if (
        error instanceof Error &&
        error.message?.includes('Auth session missing')
      ) {
        window.location.href = '/';
      } else if (error instanceof Error) {
        setError('Sign out failed: ' + error.message);
      }
    }
  }, [user]);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('AuthProvider: Initial session error:', error.message);
          setError(error.message);
          setLoading(false);
          return;
        }

        if (session) {
          setUser(session.user);
          setSession(session);
          await fetchRole(session.user.id);
        } else {
          setUser(null);
          setSession(null);
          setRole('user');
        }

        setLoading(false);

        // Set up periodic session validation (every 2 minutes)
        refreshInterval = setInterval(async () => {
          await validateSession();
        }, 120000); // 2 minutes
      } catch (error) {
        console.error('AuthProvider: Auth initialization failed:', error);
        setError('Authentication initialization failed');
        setLoading(false);
      }
    };

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setSession(null);
          setRole('user');
          setError(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setSession(session);
          await fetchRole(session.user.id);
          setError(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
          setSession(session);
          await fetchRole(session.user.id);
          setError(null);
        } else if (session?.user) {
          setUser(session.user);
          setSession(session);
          await fetchRole(session.user.id);
          setError(null);
        }
    });

    initializeAuth();

    // Cleanup
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, [validateSession]);

  const value: AuthContextType = {
    user,
    session,
    role,
    loading,
    error,
    withValidSession,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
