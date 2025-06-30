
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    password: ''
  });

  const validateForm = () => {
    const newErrors = {
      email: '',
      username: '',
      password: ''
    };

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!isLogin && !formData.username) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    const trimmedEmail = formData.email.trim().toLowerCase();

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: formData.password,
        });

        if (signInError) throw signInError;

        if (data.session) {
          navigate('/profile');
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          alert('Account created successfully! Please check your email to confirm your account.');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        throw error;
      }

    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Failed to sign in with Google');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex mb-8 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  !isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full bg-gray-700 text-white rounded-lg py-3 pl-12 pr-4 outline-none focus:ring-2 ${
                      errors.email ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`w-full bg-gray-700 text-white rounded-lg py-3 pl-12 pr-4 outline-none focus:ring-2 ${
                        errors.username ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
                      }`}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                  )}
                </div>
              )}

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full bg-gray-700 text-white rounded-lg py-3 pl-12 pr-4 outline-none focus:ring-2 ${
                      errors.password ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  isLogin ? 'Login' : 'Sign Up'
                )}
              </button>
            </form>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-white text-black py-3 rounded-lg font-semibold border hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}