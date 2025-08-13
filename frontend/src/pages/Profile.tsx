import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TOKEN_LIMIT } from '../constants';
import { User, Play, BookOpen, Clock, Settings, LogOut, Sparkles, TrendingUp, Award, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../lib/supabaseClient';

interface TokenUsage {
  total_tokens: number;
  recent_activity: Array<{
    prompt: string;
    tokens_used: number;
    created_at: string;
  }>;
}


export default function Profile() {
    const { user, loading: authLoading, signOut, withValidSession } = useAuth();
  const navigate = useNavigate();
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({ total_tokens: 0, recent_activity: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    const isDevAccount = user?.user_metadata?.role === 'developer';
    const tokensUsed = tokenUsage.total_tokens;
    const tokensRemaining = Math.max(0, TOKEN_LIMIT - tokensUsed);
    const usagePercentage = Math.min((tokensUsed / TOKEN_LIMIT) * 100, 100);

  useEffect(() => {
    // Only redirect if we're sure there's no user and auth is not loading
      if (!authLoading && !user) {
        navigate(`/login?redirectTo=${encodeURIComponent('/profile')}`);
        return;
      }

    const fetchUserData = async () => {
        if (!user || isDevAccount) {
          setLoading(false);
          return;
        }

      try {
        await withValidSession(async () => {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('Failed to get session');
            return;
          }
          
          if (!sessionData?.session?.access_token) {
            console.error('No valid session or access token');
            setError('No valid session found');
            return;
          }

            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_token_total`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionData.session.access_token}`,
                },
                body: JSON.stringify({ user_id: user.id }),
              }
            );

          if (response.ok) {
            const data = await response.json();
            console.log('Token usage data:', data);
            setTokenUsage({
              total_tokens: data.total_tokens || 0,
              recent_activity: data.recent_activity || []
            });
            setError(null);
          } else {
            const errorText = await response.text();
            console.error('Failed to fetch token usage:', response.status, errorText);
            setError(`Failed to fetch usage data: ${response.status}`);
            throw new Error(`Failed to fetch usage data: ${response.status}`);
          }
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Network error while fetching data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
    }, [user, authLoading, navigate, isDevAccount, withValidSession]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const stats = [
    {
      label: "Simulations Created",
      value: tokenUsage.recent_activity.length,
      icon: Sparkles,
      color: "text-yellow-500"
    },
    {
      label: "Account Status",
      value: isDevAccount ? "Premium" : "Standard",
      icon: Award,
      color: isDevAccount ? "text-purple-500" : "text-blue-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 text-white">
      {/* Custom Header for Profile Page */}
      <header className="fixed w-full bg-gray-900 z-50 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <Link to="/" className="flex items-center">
              <img
                src="/image copy copy copy.png"
                alt="MindRender Logo"
                className="h-10 w-auto sm:h-12 transition-transform hover:scale-105"
              />
            </Link>

            <div className="flex flex-wrap items-center justify-end w-full sm:w-auto gap-2 sm:gap-4">
              <Link to="/demo" className="text-gray-300 hover:text-white transition-colors">
                Try Demo
              </Link>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Header Section with Welcome Back and Manage Subscription */}
      <section className="pt-32 pb-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between max-w-6xl mx-auto">
            {/* Welcome Back Section - Top Left */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center mb-6 lg:mb-0"
            >
              <div className="bg-gray-800 rounded-full p-4 mr-4">
                <User className="w-12 h-12 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">
                  Welcome Back
                </h1>
                <p className="text-lg text-gray-300">{user.email}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Plan: {isDevAccount ? "Premium" : "Standard"}
                </p>
              </div>
            </motion.div>

            {/* Manage Subscription Button - Top Right */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0"
            >
              <Link to="/manage-subscription">
                <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 font-medium">
                  <CreditCard className="w-5 h-5" />
                  <span>Manage Subscription</span>
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Error Display */}
      {error && (
        <section className="py-4">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="text-red-400 text-center">
                  <div className="text-lg font-semibold mb-2">Data Loading Error</div>
                  <div className="text-sm mb-4">{error}</div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section - Keep as is but remove Token Usage box */}
      <section className="py-8 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 rounded-xl p-6 text-center"
              >
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                <p className="text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Progress (for non-judge accounts) - Keep prompts, tokens, and plan tier */}
        {!isDevAccount && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Token Usage Progress</h3>
                  <span className="text-sm text-gray-400">
                    {tokensUsed} / {TOKEN_LIMIT} tokens used
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      usagePercentage >= 90 ? 'bg-red-500' :
                      usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${usagePercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400">
                  {tokensRemaining > 0 
                    ? `${tokensRemaining} tokens remaining`
                    : "Token limit reached - contact support to continue"
                  }
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Centered Start New Simulation Button */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate('/demo')}
              className="bg-yellow-500 hover:bg-yellow-400 text-black p-6 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg text-center max-w-sm w-full"
            >
              <Play className="w-10 h-10 mb-3 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Start New Simulation</h3>
              <p className="text-base opacity-90">Create an interactive visualization</p>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      {tokenUsage.recent_activity.length > 0 && (
        <section className="py-12 bg-gray-900/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Recent Activity</h2>
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="space-y-4">
                  {tokenUsage.recent_activity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg">
                      <Clock className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-white font-medium truncate">{activity.prompt}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-400">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-sm text-yellow-500">
                            {activity.tokens_used} tokens
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}