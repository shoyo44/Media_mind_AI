import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { api } from '../services/api';
import type { UserStats } from '../types';
import { ProfileImage } from './ProfileImage';

interface ProfileProps {
  user: User;
}

export const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    try {
      // Load both stats and profile data
      const [statsData, profileData] = await Promise.all([
        api.getStats(),
        api.getProfile()
      ]);
      
      setStats(statsData);
      
      // Set username from profile preferences or fallback to default
      const savedUsername = profileData.preferences?.username;
      const fallbackUsername = user.displayName?.toLowerCase().replace(/\s+/g, '') || user.email?.split('@')[0] || 'user';
      const initialUsername = savedUsername || fallbackUsername;
      
      setUsername(initialUsername);
      setTempUsername(initialUsername);
    } catch (error) {
      console.error('Failed to load profile data:', error);
      // Fallback to default username if API fails
      const fallbackUsername = user.displayName?.toLowerCase().replace(/\s+/g, '') || user.email?.split('@')[0] || 'user';
      setUsername(fallbackUsername);
      setTempUsername(fallbackUsername);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameEdit = () => {
    setIsEditingUsername(true);
    setTempUsername(username);
  };

  const handleUsernameSave = async () => {
    if (!tempUsername.trim()) {
      alert('Username cannot be empty');
      return;
    }

    const newUsername = tempUsername.trim().toLowerCase().replace(/\s+/g, '');
    
    if (newUsername === username) {
      setIsEditingUsername(false);
      return;
    }

    setIsSavingUsername(true);
    
    try {
      // Save username to backend
      await api.updatePreferences({ username: newUsername });
      
      // Update local state
      setUsername(newUsername);
      setIsEditingUsername(false);
      
      console.log('✅ Username saved successfully:', newUsername);
    } catch (error) {
      console.error('❌ Failed to save username:', error);
      alert('Failed to save username. Please try again.');
      // Reset temp username on error
      setTempUsername(username);
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleUsernameCancel = () => {
    setTempUsername(username);
    setIsEditingUsername(false);
  };

  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Info */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center gap-6 mb-6">
          <ProfileImage
            src={user.photoURL}
            alt={user.displayName || user.email || 'User'}
            size={96}
            className="rounded-full border-4 border-purple-600 object-cover"
            fallbackClassName="rounded-full border-4 border-purple-600"
          />
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{user.displayName || user.email?.split('@')[0] || 'User'}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="font-semibold text-gray-800">
              {formatDate(user.metadata.creationTime)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Username</p>
            {isEditingUsername ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">@</span>
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter username"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleUsernameSave();
                    }
                    if (e.key === 'Escape') handleUsernameCancel();
                  }}
                />
                <button
                  onClick={handleUsernameSave}
                  disabled={isSavingUsername}
                  className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isSavingUsername ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  onClick={handleUsernameCancel}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800">@{username}</p>
                <button
                  onClick={handleUsernameEdit}
                  className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                  title="Edit username"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Your Statistics</h3>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-xl">
            <div className="text-4xl font-bold text-purple-700">
              {stats?.total_searches || 0}
            </div>
            <div className="text-purple-900 font-medium mt-2">Total Searches</div>
          </div>

          <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-xl">
            <div className="text-4xl font-bold text-green-700">
              {stats?.total_images || 0}
            </div>
            <div className="text-green-900 font-medium mt-2">Images Generated</div>
          </div>
        </div>

        {/* Most Used Roles */}
        <div>
          <h4 className="text-xl font-bold mb-4 text-gray-800">Most Used Roles</h4>
          {stats?.most_used_roles && stats.most_used_roles.length > 0 ? (
            <div className="space-y-3">
              {stats.most_used_roles.map((role, index) => (
                <div
                  key={role._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-purple-600">#{index + 1}</span>
                    <span className="font-medium text-gray-800">{role._id}</span>
                  </div>
                  <span className="text-purple-600 font-bold">{role.count} uses</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No usage data yet. Start generating content!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
