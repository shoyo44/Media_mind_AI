import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { UserPreferences, Role } from '../types';

export const Settings: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    default_temperature: 0.7,
    default_top_p: 0.9,
    favorite_roles: [],
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load user profile to get preferences
      const profile = await api.getProfile();
      if (profile.preferences) {
        setPreferences({
          default_temperature: profile.preferences.default_temperature ?? 0.7,
          default_top_p: profile.preferences.default_top_p ?? 0.9,
          favorite_roles: profile.preferences.favorite_roles ?? [],
        });
      }

      // Load available roles
      const rolesData = await api.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSaveMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await api.updatePreferences(preferences);
      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const toggleFavoriteRole = (roleName: string) => {
    setPreferences((prev) => {
      const currentFavorites = prev.favorite_roles || [];
      const isFavorite = currentFavorites.includes(roleName);
      return {
        ...prev,
        favorite_roles: isFavorite
          ? currentFavorites.filter((r) => r !== roleName)
          : [...currentFavorites, roleName],
      };
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
      <div className="bg-white rounded-xl shadow-md p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">⚙️ Settings</h2>
        <p className="text-gray-600 mb-8">
          Configure your default preferences for content generation.
        </p>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              saveMessage.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Default Temperature */}
        <div className="mb-8 pb-8 border-b">
          <label className="block mb-4 text-lg font-semibold text-gray-800">
            Default Temperature: <span className="text-purple-600">{preferences.default_temperature}</span>
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Controls randomness in generation. Lower values (0.1-0.5) produce more focused, deterministic outputs.
            Higher values (0.6-1.0) produce more creative, varied outputs.
          </p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={preferences.default_temperature || 0.7}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                default_temperature: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Focused</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Default Top P */}
        <div className="mb-8 pb-8 border-b">
          <label className="block mb-4 text-lg font-semibold text-gray-800">
            Default Top P: <span className="text-purple-600">{preferences.default_top_p}</span>
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Controls diversity via nucleus sampling. Lower values (0.1-0.5) focus on high-probability tokens.
            Higher values (0.6-1.0) consider a broader range of tokens.
          </p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={preferences.default_top_p || 0.9}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                default_top_p: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Focused</span>
            <span>Diverse</span>
          </div>
        </div>

        {/* Favorite Roles */}
        <div className="mb-8">
          <label className="block mb-4 text-lg font-semibold text-gray-800">
            Favorite Roles
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Select your frequently used roles to pin them at the top of the role list.
          </p>
          <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
            {roles.map((role) => {
              const isFavorite = preferences.favorite_roles?.includes(role.name) || false;
              return (
                <button
                  key={role.name}
                  onClick={() => toggleFavoriteRole(role.name)}
                  className={`
                    text-left p-4 rounded-lg border-2 transition-all
                    ${
                      isFavorite
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{role.name}</span>
                    {isFavorite && (
                      <svg
                        className="w-5 h-5 text-purple-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <span>💾</span>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
