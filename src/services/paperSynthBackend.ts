/**
 * PaperSynth Backend Service
 * 
 * This service provides TypeScript interfaces to communicate with the Python FastAPI backend.
 * All functions handle FormData, authentication, and error responses automatically.
 * 
 * @module paperSynthBackend
 */

import apiClient, { getApiErrorMessage } from '@/lib/api';
import { AxiosError } from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Response from the /process endpoint
 * Contains summary, generated files, and processing metadata
 */
export interface ProcessPaperResponse {
  request_id: string;
  summary: string;
  pages: number;
  summary_pdf: string | null;
  graphical_abstract: string | null;
  voiceover: string | null;
  presentation: string | null;
  features: {
    sdxl: boolean;
    tts: boolean;
    signed_downloads: boolean;
  };
  speaker_notes: string | null;
  warnings: string[];
}

/**
 * Request parameters for processing a paper
 */
export interface ProcessPaperRequest {
  file: File;
  summary_length?: 'short' | 'medium' | 'long';
  generate_visual?: boolean;
  generate_audio?: boolean;
  sdxl_preset?: 'fast' | 'balanced' | 'quality';
}

/**
 * Health check response from /health endpoint
 */
export interface HealthCheckResponse {
  status: string;
  temp_dir: string;
  rate_limit_per_minute: number;
  concurrency_limit: number;
  features: {
    sdxl_enabled: boolean;
    tts_enabled: boolean;
    signed_downloads: boolean;
  };
  validation: any;
  memory: any;
}

/**
 * Status check response for a processing request
 * Returns file URLs for a completed request
 */
export interface StatusCheckResponse {
  request_id: string;
  summary_pdf: string | null;
  graphical_abstract: string | null;
  voiceover: string | null;
  presentation: string | null;
}

/**
 * Error response from backend
 */
export interface BackendError {
  detail: string | Record<string, any> | Array<any>;
  status_code?: number;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Process a research paper PDF
 * 
 * Uploads a PDF file to the backend for processing. The backend will:
 * - Extract text and generate a summary
 * - Optionally generate a graphical abstract (SDXL)
 * - Optionally generate text-to-speech audio (ElevenLabs)
 * - Generate a PowerPoint presentation
 * 
 * @param request - Processing request with file and options
 * @returns Promise resolving to ProcessPaperResponse
 * @throws Error with extracted message from FastAPI
 * 
 * @example
 * ```typescript
 * const result = await processPaper({
 *   file: pdfFile,
 *   summary_length: 'medium',
 *   generate_visual: true,
 *   generate_audio: true,
 *   sdxl_preset: 'balanced'
 * });
 * console.log('Summary:', result.summary);
 * console.log('Audio URL:', result.voiceover);
 * ```
 */
export const processPaper = async (
  request: ProcessPaperRequest
): Promise<ProcessPaperResponse> => {
  try {
    // Build FormData with file and optional parameters
    const formData = new FormData();
    formData.append('file', request.file);

    // Add optional parameters if provided
    if (request.summary_length) {
      formData.append('summary_length', request.summary_length);
    }
    if (request.generate_visual !== undefined) {
      formData.append('generate_visual', request.generate_visual.toString());
    }
    if (request.generate_audio !== undefined) {
      formData.append('generate_audio', request.generate_audio.toString());
    }
    if (request.sdxl_preset) {
      formData.append('sdxl_preset', request.sdxl_preset);
    }

    // Send request to backend
    const response = await apiClient.post<ProcessPaperResponse>(
      '/process-paper/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Extended timeout for this specific request (inherited from api.ts config)
      }
    );

    return response.data;
  } catch (error) {
    // Extract and throw user-friendly error message
    const message = getApiErrorMessage(error);
    
    // Log detailed error in development
    if (import.meta.env.DEV) {
      console.error('processPaper error:', {
        file: request.file.name,
        size: request.file.size,
        error: error,
      });
    }

    throw new Error(message);
  }
};

/**
 * Check backend health status
 * 
 * Useful for:
 * - Verifying backend connectivity
 * - Checking which features are enabled
 * - Displaying system status to users
 * 
 * @returns Promise resolving to HealthCheckResponse
 * @throws Error if health check fails
 * 
 * @example
 * ```typescript
 * try {
 *   const health = await checkHealth();
 *   console.log('Backend status:', health.status);
 *   console.log('SDXL available:', health.features?.sdxl_available);
 * } catch (error) {
 *   console.error('Backend is down:', error.message);
 * }
 * ```
 */
export const checkHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await apiClient.get<HealthCheckResponse>('/health');
    return response.data;
  } catch (error) {
    const message = getApiErrorMessage(error);
    
    if (import.meta.env.DEV) {
      console.error('checkHealth error:', error);
    }

    throw new Error(`Health check failed: ${message}`);
  }
};

/**
 * Get processing status for a request
 * 
 * Use this to poll for completion status of long-running processes.
 * Useful for implementing progress indicators.
 * 
 * @param requestId - The request ID returned from processPaper
 * @returns Promise resolving to StatusCheckResponse
 * @throws Error if status check fails
 * 
 * @example
 * ```typescript
 * const processResult = await processPaper({ file: pdfFile });
 * 
 * // Poll for status
 * const interval = setInterval(async () => {
 *   const status = await getStatus(processResult.request_id);
 *   
 *   if (status.status === 'completed') {
 *     clearInterval(interval);
 *     console.log('Processing complete!', status.result);
 *   } else if (status.status === 'failed') {
 *     clearInterval(interval);
 *     console.error('Processing failed:', status.error);
 *   } else {
 *     console.log('Progress:', status.progress);
 *   }
 * }, 2000);
 * ```
 */
export const getStatus = async (requestId: string): Promise<StatusCheckResponse> => {
  try {
    const response = await apiClient.get<StatusCheckResponse>(
      `/status/${requestId}`
    );
    return response.data;
  } catch (error) {
    const message = getApiErrorMessage(error);
    
    if (import.meta.env.DEV) {
      console.error('getStatus error:', {
        requestId,
        error,
      });
    }

    throw new Error(`Status check failed: ${message}`);
  }
};

/**
 * Download a generated file
 * 
 * Downloads files like PDFs, audio, or presentations.
 * Handles signed URLs if backend provides them.
 * 
 * @param fileUrl - URL of the file to download
 * @param filename - Desired filename for the download
 * @returns Promise resolving when download is initiated
 * @throws Error if download fails
 * 
 * @example
 * ```typescript
 * const result = await processPaper({ file: pdfFile });
 * 
 * if (result.presentation) {
 *   await downloadFile(result.presentation, 'presentation.pptx');
 * }
 * ```
 */
export const downloadFile = async (
  fileUrl: string,
  filename: string
): Promise<void> => {
  try {
    // If it's a full URL (signed), fetch directly
    if (fileUrl.startsWith('http')) {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      // If it's a relative path, use API client
      const response = await apiClient.get(fileUrl, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
    
    if (import.meta.env.DEV) {
      console.log('Downloaded file:', filename);
    }
  } catch (error) {
    const message = getApiErrorMessage(error);
    
    if (import.meta.env.DEV) {
      console.error('downloadFile error:', {
        fileUrl,
        filename,
        error,
      });
    }

    throw new Error(`Download failed: ${message}`);
  }
};

/**
 * Validate PDF file before upload
 * 
 * Performs client-side validation to provide immediate feedback
 * before sending the file to the backend.
 * 
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 10)
 * @returns Validation result with success flag and error message
 * 
 * @example
 * ```typescript
 * const validation = validatePDFFile(file);
 * if (!validation.valid) {
 *   alert(validation.error);
 *   return;
 * }
 * // Proceed with upload
 * await processPaper({ file });
 * ```
 */
export const validatePDFFile = (
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } => {
  // Check file type
  if (file.type !== 'application/pdf') {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a PDF file.',
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB.`,
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty. Please upload a valid PDF.',
    };
  }

  return { valid: true };
};

/**
 * Format file size for display
 * 
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 * 
 * @example
 * ```typescript
 * const size = formatFileSize(2621440); // "2.5 MB"
 * ```
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Check if a feature is available based on ProcessPaperResponse
 * 
 * @param response - Response from processPaper
 * @param feature - Feature to check ('sdxl' | 'tts' | 'signed_downloads')
 * @returns True if feature is available
 * 
 * @example
 * ```typescript
 * const result = await processPaper({ file: pdfFile });
 * 
 * if (isFeatureAvailable(result, 'tts')) {
 *   // Show audio player
 * }
 * ```
 */
export const isFeatureAvailable = (
  response: ProcessPaperResponse,
  feature: 'sdxl' | 'tts' | 'signed_downloads'
): boolean => {
  return response.features[feature] === true;
};

// ============================================================================
// Export all types and functions
// ============================================================================

export default {
  processPaper,
  checkHealth,
  getStatus,
  downloadFile,
  validatePDFFile,
  formatFileSize,
  isFeatureAvailable,
};

