import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { Logo } from './Logo';
import { ProfileImage } from './ProfileImage';

interface HeaderProps {
  user: User;
  onSignOut: () => void;
  onShowStats: () => void;
  onNavigateToProfile: () => void;
  onNavigateToHistory: () => void;
  onNavigateToSettings: () => void;
  onNavigateToAbout: () => void;
  onNavigateToGenerate: () => void;
  activeTab?: 'generate' | 'profile' | 'history' | 'settings' | 'about';
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  onSignOut, 
  onShowStats,
  onNavigateToProfile,
  onNavigateToHistory,
  onNavigateToSettings,
  onNavigateToAbout,
  onNavigateToGenerate,
  activeTab = 'generate'
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const moreMenuItems = [
    {
      id: 'history',
      label: 'History',
      icon: '📜',
      onClick: () => {
        setShowMoreMenu(false);
        onNavigateToHistory();
      },
      description: 'View past generations',
      active: activeTab === 'history'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      onClick: () => {
        setShowMoreMenu(false);
        onNavigateToProfile();
      },
      description: 'Manage your profile',
      active: activeTab === 'profile'
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: '📊',
      onClick: () => {
        setShowMoreMenu(false);
        onShowStats();
      },
      description: 'View statistics',
      active: false
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => {
        setShowMoreMenu(false);
        onNavigateToSettings();
      },
      description: 'Configure preferences',
      active: activeTab === 'settings'
    },
    {
      id: 'about',
      label: 'About MediaMind AI',
      icon: 'ℹ️',
      onClick: () => {
        setShowMoreMenu(false);
        onNavigateToAbout();
      },
      description: 'Learn about features and usage',
      active: activeTab === 'about'
    },
    {
      id: 'signout',
      label: 'Sign Out',
      icon: '🚪',
      onClick: () => {
        setShowMoreMenu(false);
        onSignOut();
      },
      description: 'Sign out of your account',
      active: false,
      isDestructive: true
    },
  ];

  return (
    <header className="bg-gradient-to-r from-purple-600 to-purple-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Back Button & Logo */}
          <div className="flex items-center gap-3">
            {/* Back Arrow - Only show when not on generate page */}
            {activeTab !== 'generate' && (
              <button
                onClick={onNavigateToGenerate}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all border border-white/20 hover:border-white/40 group"
                title="Back to Generate Content"
              >
                <svg 
                  className="w-5 h-5 text-white group-hover:scale-110 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            
            {/* Logo */}
            <Logo 
              variant="light" 
              size="md" 
              onClick={onNavigateToGenerate}
              className="cursor-pointer"
            />
          </div>
          
          {/* User Profile & Three Dots Menu */}
          <div className="flex items-center gap-3">
            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <ProfileImage
                  src={user.photoURL}
                  alt={user.displayName || user.email || 'User'}
                  size={36}
                  className="rounded-full border-2 border-white shadow-md object-cover"
                  fallbackClassName="rounded-full border-2 border-white shadow-md"
                />
                {/* Debug indicator */}
                {!user.photoURL && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" title="No photoURL available" />
                )}
              </div>
              <span className="font-medium hidden lg:inline max-w-[150px] truncate">
                {user.displayName || user.email?.split('@')[0] || 'User'}
              </span>
            </div>
            
            {/* Three Dots Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all border border-white/20 hover:border-white/40 group"
                title="More options"
              >
                <svg 
                  className="w-5 h-5 text-white" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              {/* More Menu Dropdown */}
              {showMoreMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMoreMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-out origin-top-right">
                    {moreMenuItems.map((item) => (
                      <div key={item.id}>
                        {item.id === 'signout' && (
                          <div className="border-t border-gray-200 my-1"></div>
                        )}
                        <button
                          onClick={item.onClick}
                          className={`
                            w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3
                            ${item.isDestructive
                              ? 'text-red-600 hover:bg-red-50'
                              : item.active 
                                ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-600' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                          </div>
                          {item.active && !item.isDestructive && (
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
