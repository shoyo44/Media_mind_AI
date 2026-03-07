import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { UserStats } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Your Statistics</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-xl">
                  <div className="text-4xl font-bold text-purple-700">
                    {stats.total_searches}
                  </div>
                  <div className="text-purple-900 font-medium mt-2">Total Searches</div>
                </div>

                <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-xl">
                  <div className="text-4xl font-bold text-green-700">
                    {stats.total_images}
                  </div>
                  <div className="text-green-900 font-medium mt-2">Images Generated</div>
                </div>
              </div>

              {/* Most Used Roles */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Most Used Roles</h3>
                {stats.most_used_roles && stats.most_used_roles.length > 0 ? (
                  <div className="space-y-2">
                    {stats.most_used_roles.map((role, index) => (
                      <div
                        key={role._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-purple-600">
                            #{index + 1}
                          </span>
                          <span className="font-medium text-gray-800">{role._id}</span>
                        </div>
                        <span className="text-purple-600 font-bold">{role.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No data yet</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Failed to load statistics</p>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
