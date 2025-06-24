import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Github, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, loading, error, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      console.log('Navbar: Initiating sign out...');
      await signOut();
    } catch (error: any) {
      console.error('Navbar: Sign out failed:', error);
    }
  };

  const handleDemoClick = () => {
    if (user) {
      console.log('Navbar: Navigating to demo (user authenticated):', user.email);
      navigate('/demo');
    } else {
      console.log('Navbar: Redirecting to auth (user not authenticated)');
      navigate('/auth');
    }
  };

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/auth');
    }
  };

  return (
    <nav className="fixed w-full bg-gray-900/90 backdrop-blur-sm z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/image copy copy copy.png" 
              alt="MindRender Logo" 
              className="h-12 w-auto sm:h-14 md:h-16 lg:h-18 transition-transform hover:scale-105"
            />
          </Link>
          
          <div className="flex items-center space-x-6">
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
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">{user.email}</span>
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
                to="/auth" 
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
      </div>
    </nav>
  );
}