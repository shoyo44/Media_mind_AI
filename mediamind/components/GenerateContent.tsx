import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Role } from '../types';
import { renderMarkdown } from '../utils/markdown';

interface GenerateContentProps {
  restoreData?: {
    userInput: string;
    roleName: string;
    temperature: number;
    topP: number;
  } | null;
  onRestoreComplete?: () => void;
}

export const GenerateContent: React.FC<GenerateContentProps> = ({
  restoreData,
  onRestoreComplete
}) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [sortedRoles, setSortedRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [generateImageWithContent, setGenerateImageWithContent] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [favoriteRoles, setFavoriteRoles] = useState<string[]>([]);
  const [roleSearch, setRoleSearch] = useState('');

  useEffect(() => {
    loadRoles();
    loadUserPreferences();
  }, []);

  // Sort roles when roles or favoriteRoles change
  useEffect(() => {
    if (roles.length > 0) {
      const sorted = [...roles].sort((a, b) => {
        const aIsFavorite = favoriteRoles.includes(a.name);
        const bIsFavorite = favoriteRoles.includes(b.name);

        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return 0;
      });
      setSortedRoles(sorted);

      // Select first role if none selected
      if (!selectedRole && sorted.length > 0) {
        setSelectedRole(sorted[0]);
      }
    }
  }, [roles, favoriteRoles]);

  const loadUserPreferences = async () => {
    try {
      const profile = await api.getProfile();
      if (profile.preferences) {
        // Set default temperature and topP from preferences
        if (profile.preferences.default_temperature !== undefined) {
          setTemperature(profile.preferences.default_temperature);
        }
        if (profile.preferences.default_top_p !== undefined) {
          setTopP(profile.preferences.default_top_p);
        }
        // Set favorite roles
        if (profile.preferences.favorite_roles) {
          setFavoriteRoles(profile.preferences.favorite_roles);
        }
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      // Continue with defaults if preferences fail to load
    }
  };

  // Handle restore data from history
  useEffect(() => {
    if (restoreData && sortedRoles.length > 0) {
      setUserInput(restoreData.userInput);
      setTemperature(restoreData.temperature);
      setTopP(restoreData.topP);

      // Find and select the role
      const role = sortedRoles.find(r => r.name === restoreData.roleName);
      if (role) {
        setSelectedRole(role);
      }

      // Clear restore data after applying
      if (onRestoreComplete) {
        onRestoreComplete();
      }
    }
  }, [restoreData, sortedRoles, onRestoreComplete]);

  const loadRoles = async () => {
    try {
      console.log('🔄 Loading roles...');
      const rolesData = await api.getRoles();
      console.log('✅ Roles loaded:', rolesData);
      setRoles(rolesData);
    } catch (error) {
      console.error('❌ Failed to load roles:', error);
      // Show error to user
      setResult('❌ Error: Failed to load roles. Please refresh the page.');
    }
  };

  const handleGenerate = async () => {
    if (!selectedRole || !userInput.trim()) return;

    setLoading(true);
    setResult('');
    setGeneratedImage(null);
    setEnhancedPrompt(null);

    try {
      // Build promises array — text generation always runs
      const textPromise = api.generateContent({
        role_name: selectedRole.name,
        user_input: userInput,
        temperature,
        top_p: topP,
      });

      // Handle special sequential case for Non-Technical Bridge
      console.log("Checking sequential role match:", selectedRole.name, generateImageWithContent);
      if (selectedRole.name === 'Non-Technical Bridge' && generateImageWithContent) {
        setImageLoading(true);
        // 1. Wait for text first
        const textResult = await textPromise;
        setResult(textResult.result);
        console.log('✅ Content generated sequentially, result length:', textResult.result.length);

        // 2. Use generated text as the image prompt (truncate to 1000 chars to avoid overwhelming the cloudflare limit)
        const genTextForImage = textResult.result.substring(0, 1000);

        const imageResult = await api.generateImage({
          prompt: genTextForImage,
          role_name: selectedRole.name,
          model: "@cf/black-forest-labs/flux-2-dev",
          width: 1024,
          height: 768,
          steps: 25,
          guidance: 7.5,
        });

        setGeneratedImage(`data:image/png;base64,${imageResult.image_base64}`);
        setEnhancedPrompt(imageResult.enhanced_prompt);
        console.log('✅ Image generated from content sequentially');
        console.log('✨ Enhanced prompt:', imageResult.enhanced_prompt);
      } else {
        // Run both in parallel for all other roles
        let imagePromise: Promise<any> | null = null;
        if (generateImageWithContent) {
          setImageLoading(true);
          imagePromise = api.generateImage({
            prompt: userInput,
            role_name: selectedRole.name,
            model: "@cf/black-forest-labs/flux-2-dev",
            width: 1024,
            height: 768,
            steps: 25,
            guidance: 7.5,
          });
        }

        const [textResult, imageResult] = await Promise.allSettled([
          textPromise,
          imagePromise || Promise.resolve(null),
        ]);

        // Handle text result
        if (textResult.status === 'fulfilled' && textResult.value) {
          setResult(textResult.value.result);
          console.log('✅ Content generated, result length:', textResult.value.result.length);
        } else if (textResult.status === 'rejected') {
          console.error('Generation error:', textResult.reason);
          setResult('❌ Error: ' + (textResult.reason instanceof Error ? textResult.reason.message : 'Failed to generate content'));
        }

        // Handle image result
        if (imageResult.status === 'fulfilled' && imageResult.value) {
          setGeneratedImage(`data:image/png;base64,${imageResult.value.image_base64}`);
          setEnhancedPrompt(imageResult.value.enhanced_prompt);
          console.log('✅ Image generated from content');
          console.log('✨ Enhanced prompt:', imageResult.value.enhanced_prompt);
        } else if (imageResult.status === 'rejected') {
          console.error('Image generation error:', imageResult.reason);
          // Don't show error alert for optional image generation
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      setResult('❌ Error: ' + (error instanceof Error ? error.message : 'Failed to generate content'));
    } finally {
      setLoading(false);
      setImageLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    // Show toast notification (simple alert for now, can be enhanced)
    const button = document.querySelector('[data-copy-button]') as HTMLElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✓ Copied!';
      setTimeout(() => {
        if (button) button.textContent = originalText;
      }, 2000);
    }
  };

  // Filter roles based on search
  const filteredRoles = sortedRoles.filter(role =>
    role.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
    role.description?.toLowerCase().includes(roleSearch.toLowerCase())
  );


  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Content Generation</h1>
        <p className="text-sm text-gray-600">Select a role and provide your input to generate AI-powered content</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        {/* Left Panel: Role Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col" style={{ height: '500px' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 flex-shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🎭</span>
                Select Role
              </h2>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Roles List with Custom Scrollbar */}
            <div
              className="px-4 py-3 flex-1 overflow-y-auto role-scrollbar"
              style={{
                minHeight: 0
              }}
            >
              {filteredRoles.length > 0 ? (
                <div className="space-y-2">
                  {filteredRoles.map((role) => {
                    const isFavorite = favoriteRoles.includes(role.name);
                    const isSelected = selectedRole?.name === role.name;
                    return (
                      <button
                        key={role.name}
                        onClick={() => setSelectedRole(role)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${isSelected
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg transform scale-[1.02]'
                          : 'bg-gray-50 hover:bg-purple-50 border-2 border-transparent hover:border-purple-200 text-gray-800'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                {role.name}
                              </span>
                              {isFavorite && (
                                <svg
                                  className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-purple-600'
                                    }`}
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
                            {role.description && (
                              <p className={`text-xs mt-1 line-clamp-2 ${isSelected ? 'text-purple-100' : 'text-gray-600'
                                }`}>
                                {role.description}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <svg
                              className="w-5 h-5 text-white flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : sortedRoles.length > 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No roles found matching "{roleSearch}"</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading roles...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Input & Output */}
        <div className="lg:col-span-2 space-y-4">
          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span>✍️</span>
                    Input
                  </h2>
                  {selectedRole && (
                    <p className="text-xs text-gray-600 mt-0.5">Using: <span className="font-semibold text-purple-600">{selectedRole.name}</span></p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="relative">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  rows={5}
                  disabled={!selectedRole}
                  placeholder={selectedRole ? selectedRole.ui_placeholder : 'Please select a role first to start generating content...'}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none resize-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-all text-gray-800 placeholder-gray-400 text-sm"
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {userInput.length} characters
                </div>
              </div>

              {/* Optional Image Generation Checkbox */}
              <div className={`mt-3 flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${!selectedRole || !userInput.trim()
                ? 'bg-gray-50 border-gray-200'
                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300'
                }`}>
                <input
                  type="checkbox"
                  id="generateImageCheckbox"
                  checked={generateImageWithContent}
                  onChange={(e) => setGenerateImageWithContent(e.target.checked)}
                  disabled={!selectedRole || !userInput.trim()}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-blue-600"
                />
                <label
                  htmlFor="generateImageCheckbox"
                  className={`text-sm font-medium cursor-pointer flex items-center gap-2 flex-1 ${!selectedRole || !userInput.trim()
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:text-gray-900'
                    }`}
                >
                  <span className="text-lg">🎨</span>
                  <div>
                    <div className="font-semibold text-xs">Generate Image</div>
                    <div className="text-xs text-gray-500">Create a visual representation</div>
                  </div>
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!selectedRole || !userInput.trim() || loading}
                className="mt-4 w-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white py-3 rounded-xl font-bold hover:from-purple-700 hover:via-purple-800 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">✨</span>
                    <span>Generate Content</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span>📄</span>
                  Output
                  {result && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      {result.length} chars
                    </span>
                  )}
                </h2>
                {result && (
                  <div className="flex items-center gap-2">
                    <button
                      data-copy-button
                      onClick={copyToClipboard}
                      className="px-3 py-1.5 bg-white hover:bg-green-50 border border-gray-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm hover:shadow text-gray-700"
                      title="Copy to clipboard"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        setResult('');
                        setGeneratedImage(null);
                        setEnhancedPrompt(null);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-red-50 border border-gray-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm hover:shadow text-gray-700"
                      title="Clear output"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="min-h-[300px] max-h-[600px] overflow-y-auto p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-full min-h-[250px]">
                  <div className="text-center">
                    <div className="w-14 h-14 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-700 font-semibold text-base">
                      {generateImageWithContent && imageLoading
                        ? 'Generating content and image...'
                        : 'Generating your content...'}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              ) : imageLoading && !loading ? (
                <div className="flex items-center justify-center h-full min-h-[250px]">
                  <div className="text-center">
                    <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-700 font-semibold text-base">Generating your image...</p>
                    <p className="text-gray-500 text-sm mt-2">Creating a visual representation</p>
                  </div>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <div
                    className="prose prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-purple-600 prose-strong:text-gray-900 prose-code:text-purple-700 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-li:text-gray-700 prose-blockquote:text-gray-600 prose-blockquote:border-purple-300"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 via-indigo-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <span className="text-3xl">✨</span>
                  </div>
                  <p className="text-gray-600 font-semibold text-base mb-1">Generated content will appear here</p>
                  <p className="text-gray-400 text-sm">Select a role and enter your input to get started</p>
                  <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Your AI-generated content will be displayed here</span>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Image Display */}
            {generatedImage && (
              <div className="mt-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <span>🖼️</span>
                    Generated Image
                  </h3>
                  <button
                    onClick={() => {
                      setGeneratedImage(null);
                      setEnhancedPrompt(null);
                    }}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors"
                    title="Close"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Enhanced Prompt Display */}
                {enhancedPrompt && (
                  <div className="mb-3 p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                        <span>✨</span>
                        Enhanced Prompt
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(enhancedPrompt)}
                        className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors font-medium"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 italic leading-relaxed line-clamp-2">{enhancedPrompt}</p>
                  </div>
                )}

                <div className="flex justify-center bg-white rounded-lg p-3 shadow-inner mb-3">
                  <img
                    src={generatedImage}
                    alt="Generated from content"
                    className="max-w-full h-auto rounded-lg shadow-md"
                  />
                </div>
                <div className="flex gap-2">
                  <a
                    href={generatedImage}
                    download="generated-image.png"
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
