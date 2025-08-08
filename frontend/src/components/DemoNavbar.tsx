import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, User } from 'lucide-react';
import TokenDisplay from './TokenDisplay';

interface DemoNavbarProps {
  role: 'user' | 'dev';
  tokenUsage: number;
  isTokenLimitReached: boolean;
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  handleSignOut: () => Promise<void>;
}

export default function DemoNavbar({
  role,
  tokenUsage,
  isTokenLimitReached,
  mobileMenuOpen,
  toggleMobileMenu,
  handleSignOut,
}: DemoNavbarProps) {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm flex-shrink-0">
      <div className="flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <h1 className="text-lg sm:text-2xl font-bold text-white">
            MindRender
          </h1>
          <div className="hidden md:block w-px h-6 bg-gray-600" />
          <div className="hidden md:block text-sm text-gray-400">
            Interactive Learning Simulations
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <TokenDisplay
            role={role}
            tokenUsage={tokenUsage}
            isTokenLimitReached={isTokenLimitReached}
          />

          <button
            onClick={toggleMobileMenu}
            className="md:hidden bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">Profile</span>
            </button>
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center space-x-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-700 bg-gray-800 p-4">
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleProfileClick}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center justify-center space-x-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
