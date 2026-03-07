// User & Authentication Types
export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  display_name: string | null;
  photo_url: string | null;
  created_at: string;
  last_login: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  default_temperature?: number;
  default_top_p?: number;
  favorite_roles?: string[];
  username?: string;
}

// AI Generation Types
export interface Role {
  id: string;
  name: string;
  engine: string;
  description: string;
  ui_placeholder: string;
}

export interface GenerateContentPayload {
  role_name: string;
  user_input: string;
  temperature: number;
  top_p: number;
}

export interface GenerateContentResponse {
  role: string;
  result: string;
}

// Image Generation Types
export interface ImageGenerationPayload {
  prompt: string;
  role_name?: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
}

export interface ImageGenerationResponse {
  image_base64: string;
  prompt: string;
  enhanced_prompt: string;
  model: string;
  timestamp: string;
}

// History Types
export interface SearchHistoryEntry {
  _id: string;
  uid: string;
  role_name: string;
  user_input: string;
  result: string;
  temperature: number;
  top_p: number;
  timestamp: string;
}

export interface ImageHistoryEntry {
  _id: string;
  uid: string;
  original_prompt: string;
  enhanced_prompt: string;
  model: string;
  width: number;
  height: number;
  image_base64: string;
  timestamp: string;
}

export interface HistoryResponse {
  history: SearchHistoryEntry[];
}

export interface ImageHistoryResponse {
  history: ImageHistoryEntry[];
}

// Stats Types
export interface UserStats {
  total_searches: number;
  total_images: number;
  most_used_roles: RoleUsage[];
}

export interface RoleUsage {
  _id: string;
  count: number;
}

// API Error Types
export interface APIError {
  detail: string;
}
