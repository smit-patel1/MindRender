import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Github, LogIn, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // CRITICAL: Never render navbar on demo page, auth callback page, or profile page
  if (location.pathname === '/demo' || location.pathname === '/auth/callback' || location.pathname === '/profile') {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Navbar: Sign out failed:', error);
    }
  };

  const handleDemoClick = () => {
      if (user) {
        navigate('/demo');
      } else {
        navigate('/login');
      }
  };

  const handleProfileClick = () => {
      if (user) {
        navigate('/profile');
      } else {
        navigate('/login');
      }
  };

  return (
    <nav className="fixed w-full bg-gray-900 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
              <img
                src="/image copy copy copy.png"
                alt="MindRender Logo"
                className="h-10 w-auto sm:h-12 md:h-14 transition-transform hover:scale-105"
              />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-gray-300 hover:text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <button
                onClick={handleDemoClick}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Try Demo
              </button>
              <Link to="/learn" className="text-gray-300 hover:text-white transition-colors">
                Learn More
              </Link>
              <a
                href="https://github.com/smit-patel1/MindRender"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>

              {loading ? (
                <div className="w-20 h-10 bg-gray-700 rounded-lg animate-pulse"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}

              {error && (
                <div className="text-red-400 text-sm max-w-xs truncate">
                  Auth Error: {error}
                </div>
              )}
            </div>
          </div>
          {menuOpen && (
            <div className="md:hidden mt-4 space-y-4">
              <Link
                to="/"
                className="block text-gray-300 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleDemoClick();
                }}
                className="block w-full text-left text-gray-300 hover:text-white"
              >
                Try Demo
              </button>
              <Link
                to="/learn"
                className="block text-gray-300 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                Learn More
              </Link>
              <a
                href="https://github.com/smit-patel1/MindRender"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-gray-300 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                GitHub
              </a>

              {loading ? (
                <div className="w-full h-10 bg-gray-700 rounded-lg animate-pulse"></div>
              ) : user ? (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleProfileClick();
                    }}
                    className="w-full bg-gray-700 text-gray-300 hover:bg-gray-600 px-3 py-2 rounded-lg flex items-center justify-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors text-center"
                >
                  Login
                </Link>
              )}

              {error && (
                <div className="text-red-400 text-sm max-w-xs truncate">
                  Auth Error: {error}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    );
  }