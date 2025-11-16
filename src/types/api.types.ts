/**
 * API Type Definitions for PaperSynth
 * 
 * This file contains all TypeScript interfaces and types for API communication
 * between the React frontend and Python backend.
 * 
 * Backend developers: Use these interfaces as a reference for API response formats.
 */

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * User registration data sent to backend
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

/**
 * User login credentials sent to backend
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Authentication response from backend
 * Returned after successful login or registration
 */
export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: UserData;
}

/**
 * User data object
 */
export interface UserData {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
}

// ============================================================================
// File Processing Types
// ============================================================================

/**
 * PDF summarization response from backend
 * Returned after successful PDF processing
 */
export interface SummarizeResponse {
  file_id: string;
  name: string;
  size: number;
  pages: number;
  summary: string;
  audio_url: string;
  presentation_url: string;
  processing_time?: number;
  metadata?: FileMetadata;
}

/**
 * Optional file metadata
 */
export interface FileMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  created_date?: string;
  modified_date?: string;
}

/**
 * File upload progress callback data
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Standard API error response format
 * Backend should return errors in this format
 */
export interface ApiError {
  detail: string;
  error_code?: string;
  field?: string;
  status_code?: number;
}

/**
 * Validation error for form fields
 */
export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================================
// Common Response Wrappers
// ============================================================================

/**
 * Generic success response wrapper
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Generic error response wrapper
 */
export interface ErrorResponse {
  success: false;
  error: ApiError;
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * Headers for authenticated requests
 */
export interface AuthHeaders {
  Authorization: string;
  'Content-Type'?: string;
}

/**
 * File upload request configuration
 */
export interface FileUploadConfig {
  onUploadProgress?: (progress: UploadProgress) => void;
  timeout?: number;
}

// ============================================================================
// Frontend-Specific Types (Internal Use)
// ============================================================================

/**
 * File data stored in component state
 * Extended version of SummarizeResponse for frontend use
 */
export interface FileData extends SummarizeResponse {
  uploaded_at?: Date;
  is_favorite?: boolean;
  view_count?: number;
}

/**
 * User authentication state
 */
export interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

// ============================================================================
// API Endpoint Constants
// ============================================================================

/**
 * API endpoint paths
 * These should match the backend routes
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  
  // File Processing
  FILES: {
    SUMMARIZE: '/api/summarize',
    AUDIO: '/api/files/audio',
    PRESENTATION: '/api/files/pptx',
    DOWNLOAD: '/api/files/download',
  },
  
  // User Management (Optional)
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/update',
    DELETE: '/api/user/delete',
  },
} as const;

// ============================================================================
// HTTP Status Codes
// ============================================================================

/**
 * Common HTTP status codes used in the API
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: any): response is ApiError {
  return response && typeof response.detail === 'string';
}

/**
 * Type guard to check if response is auth response
 */
export function isAuthResponse(response: any): response is AuthResponse {
  return (
    response &&
    typeof response.access_token === 'string' &&
    response.token_type === 'bearer' &&
    response.user &&
    typeof response.user.id === 'string'
  );
}

/**
 * Type guard to check if response is summarize response
 */
export function isSummarizeResponse(response: any): response is SummarizeResponse {
  return (
    response &&
    typeof response.file_id === 'string' &&
    typeof response.name === 'string' &&
    typeof response.summary === 'string'
  );
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract response data type from API function
 */
export type ApiResponse<T> = Promise<T>;

/**
 * Paginated response wrapper (for future use)
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Re-export for convenience
  RegisterRequest as RegisterData,
  LoginRequest as LoginCredentials,
};

