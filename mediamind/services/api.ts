import { auth } from '../config/firebase';
import type {
  GenerateContentPayload,
  GenerateContentResponse,
  ImageGenerationPayload,
  ImageGenerationResponse,
  HistoryResponse,
  ImageHistoryResponse,
  UserProfile,
  UserStats,
  UserPreferences,
  Role,
  APIError
} from '../types';

// Match the working index4.html API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://media-mind-ai.onrender.com/api/mediamind/v1';

// Cache token like index4.html does
let cachedToken: string | null = null;
let tokenUser: any = null;

// Clear token cache (call this on sign out)
export function clearTokenCache() {
  cachedToken = null;
  tokenUser = null;
}

// Get the current user's ID token (matching index4.html approach)
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user. Please sign in again.');
  }

  // If we have a cached token for this user, use it (like index4.html)
  if (cachedToken && tokenUser === user) {
    return cachedToken;
  }

  try {
    // Get token WITHOUT force refresh (matching index4.html: await user.getIdToken())
    const token = await user.getIdToken();
    cachedToken = token;
    tokenUser = user;
    console.log('✅ Token retrieved successfully');
    return token;
  } catch (error) {
    console.error('❌ Error getting token:', error);
    cachedToken = null;
    tokenUser = null;
    throw new Error('Failed to get authentication token. Please sign in again.');
  }
}

// Generic API call function with typed response (requires authentication)
async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: APIError;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || 'API request failed' };
      }
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.detail || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ API Call Error:', error);
    throw error;
  }
}

// API call without authentication (for public endpoints like /roles)
async function apiCallPublic<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: APIError;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { detail: errorText || 'API request failed' };
      }
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.detail || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ API Call Error:', error);
    throw error;
  }
}

// API Service Functions
export const api = {
  // Content Generation
  generateContent: (payload: GenerateContentPayload) =>
    apiCall<GenerateContentResponse>('/generate', 'POST', payload),

  // Image Generation
  generateImage: (payload: ImageGenerationPayload) =>
    apiCall<ImageGenerationResponse>('/generate-image', 'POST', payload),

  // History
  getHistory: (limit: number = 50) =>
    apiCall<HistoryResponse>(`/history?limit=${limit}`),

  getImageHistory: (limit: number = 20) =>
    apiCall<ImageHistoryResponse>(`/image-history?limit=${limit}`),

  deleteHistoryItem: (historyId: string) =>
    apiCall<{ message: string }>(`/history/${historyId}`, 'DELETE'),

  clearHistory: () =>
    apiCall<{ message: string }>('/history', 'DELETE'),

  // Profile
  getProfile: () =>
    apiCall<UserProfile>('/profile'),

  updatePreferences: (preferences: UserPreferences) =>
    apiCall<{ message: string; preferences: UserPreferences }>(
      '/profile/preferences',
      'PUT',
      preferences
    ),

  // Stats
  getStats: () =>
    apiCall<UserStats>('/stats'),

  // Roles (public endpoint, no auth required)
  getRoles: () =>
    apiCallPublic<Role[]>('/roles'),
};

export default api;
