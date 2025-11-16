/**
 * Backend Response Adapter
 * 
 * This module transforms the Python FastAPI backend response format
 * into the format expected by the React frontend components.
 * 
 * Backend uses snake_case with specific field names (request_id, voiceover, etc.)
 * Frontend expects camelCase with different field names (file_id, audio_url, etc.)
 * 
 * @module backendAdapter
 */

import type { FileData, FileMetadata } from '@/types/api.types';
import type { ProcessPaperResponse } from './paperSynthBackend';

// Re-export backend types for convenience
export type { ProcessPaperResponse } from './paperSynthBackend';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Extended FileData with backend-specific fields
 */
export interface AdaptedFileData extends FileData {
  summary_pdf_url?: string;
  graphical_abstract_url?: string;
  speaker_notes?: string;
  warnings?: string[];
  features?: {
    sdxl: boolean;
    tts: boolean;
    signed_downloads: boolean;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Estimate number of pages based on file size
 * 
 * Average PDF page is approximately 50-100KB with images, 20KB text-only.
 * This provides a rough estimate when actual page count isn't available.
 * 
 * @param fileSize - File size in bytes
 * @returns Estimated page count
 */
const estimatePageCount = (fileSize: number): number => {
  const AVERAGE_PAGE_SIZE = 70 * 1024; // 70KB per page (conservative estimate)
  const estimatedPages = Math.ceil(fileSize / AVERAGE_PAGE_SIZE);
  
  // Clamp between reasonable bounds
  return Math.max(1, Math.min(estimatedPages, 1000));
};

/**
 * Safely convert null to undefined
 * Frontend prefers undefined for optional fields
 * 
 * @param value - Value that might be null
 * @returns Value or undefined
 */
const nullToUndefined = <T>(value: T | null): T | undefined => {
  return value === null ? undefined : value;
};

/**
 * Extract metadata from backend response
 * 
 * @param backendResponse - Response from backend
 * @param originalFile - Original uploaded file
 * @returns FileMetadata object
 */
const extractMetadata = (
  backendResponse: ProcessPaperResponse,
  originalFile: File
): FileMetadata | undefined => {
  // If we have no metadata sources, return undefined
  if (!backendResponse.speaker_notes && !backendResponse.warnings.length) {
    return undefined;
  }

  return {
    title: originalFile.name.replace('.pdf', ''),
    created_date: new Date().toISOString(),
    modified_date: new Date(originalFile.lastModified).toISOString(),
  };
};

// ============================================================================
// Main Adapter Function
// ============================================================================

/**
 * Adapt backend ProcessPaperResponse to frontend FileData format
 * 
 * Transforms field names and structure to match frontend expectations:
 * - request_id → file_id
 * - voiceover → audio_url
 * - presentation → presentation_url
 * - summary_pdf → summary_pdf_url
 * - graphical_abstract → graphical_abstract_url
 * - Adds name, size from original File object
 * - Estimates pages based on file size
 * - Converts null to undefined for optional fields
 * - Preserves backend-specific fields (warnings, features, speaker_notes)
 * 
 * @param backendResponse - Response from Python backend
 * @param originalFile - The original File object that was uploaded
 * @returns Adapted FileData object for frontend consumption
 * 
 * @example
 * ```typescript
 * const backendResult = await processPaper({ file: myPDF });
 * const frontendData = adaptBackendResponse(backendResult, myPDF);
 * 
 * // Now use with frontend components
 * setUploadedFile(frontendData);
 * console.log(frontendData.audio_url);    // Instead of voiceover
 * console.log(frontendData.file_id);      // Instead of request_id
 * ```
 */
export function adaptBackendResponse(
  backendResponse: ProcessPaperResponse,
  originalFile: File
): AdaptedFileData {
  // Core mapping
  const adaptedData: AdaptedFileData = {
    // Backend request_id becomes frontend file_id
    file_id: backendResponse.request_id,
    
    // File information from original File object
    name: originalFile.name,
    size: originalFile.size,
    pages: backendResponse.pages,  // Use actual page count from backend
    
    // Summary is used by both (same field name)
    summary: backendResponse.summary,
    
    // URL mappings (convert null to empty string for consistency)
    audio_url: backendResponse.voiceover || '',
    presentation_url: backendResponse.presentation || '',
    
    // Additional backend-specific URLs
    summary_pdf_url: nullToUndefined(backendResponse.summary_pdf),
    graphical_abstract_url: nullToUndefined(backendResponse.graphical_abstract),
    
    // Backend-specific fields
    speaker_notes: nullToUndefined(backendResponse.speaker_notes),
    warnings: backendResponse.warnings.length > 0 ? backendResponse.warnings : undefined,
    features: backendResponse.features,
    
    // Metadata extraction
    metadata: extractMetadata(backendResponse, originalFile),
    
    // Frontend-specific fields
    uploaded_at: new Date(),
  };

  return adaptedData;
}

/**
 * Adapt multiple backend responses (for batch processing)
 * 
 * @param responses - Array of backend responses
 * @param files - Array of original File objects
 * @returns Array of adapted FileData objects
 * 
 * @example
 * ```typescript
 * const results = await Promise.all(
 *   files.map(file => processPaper({ file }))
 * );
 * const adaptedResults = adaptMultipleResponses(results, files);
 * ```
 */
export function adaptMultipleResponses(
  responses: ProcessPaperResponse[],
  files: File[]
): AdaptedFileData[] {
  if (responses.length !== files.length) {
    throw new Error(
      `Mismatch: ${responses.length} responses but ${files.length} files`
    );
  }

  return responses.map((response, index) => 
    adaptBackendResponse(response, files[index])
  );
}

/**
 * Check if audio is available in the adapted response
 * 
 * @param data - Adapted file data
 * @returns True if audio URL is available and TTS feature is enabled
 * 
 * @example
 * ```typescript
 * if (hasAudio(adaptedData)) {
 *   // Show audio player
 * }
 * ```
 */
export function hasAudio(data: AdaptedFileData): boolean {
  return !!(
    data.audio_url && 
    data.audio_url !== '' && 
    data.features?.tts === true
  );
}

/**
 * Check if presentation is available in the adapted response
 * 
 * @param data - Adapted file data
 * @returns True if presentation URL is available
 * 
 * @example
 * ```typescript
 * if (hasPresentation(adaptedData)) {
 *   // Show download button
 * }
 * ```
 */
export function hasPresentation(data: AdaptedFileData): boolean {
  return !!(data.presentation_url && data.presentation_url !== '');
}

/**
 * Check if graphical abstract is available in the adapted response
 * 
 * @param data - Adapted file data
 * @returns True if graphical abstract URL is available and SDXL feature is enabled
 * 
 * @example
 * ```typescript
 * if (hasGraphicalAbstract(adaptedData)) {
 *   // Show image
 * }
 * ```
 */
export function hasGraphicalAbstract(data: AdaptedFileData): boolean {
  return !!(
    data.graphical_abstract_url && 
    data.features?.sdxl === true
  );
}

/**
 * Check if summary PDF is available in the adapted response
 * 
 * @param data - Adapted file data
 * @returns True if summary PDF URL is available
 * 
 * @example
 * ```typescript
 * if (hasSummaryPDF(adaptedData)) {
 *   // Show PDF download button
 * }
 * ```
 */
export function hasSummaryPDF(data: AdaptedFileData): boolean {
  return !!(data.summary_pdf_url && data.summary_pdf_url !== '');
}

/**
 * Get all available download URLs from the adapted response
 * 
 * @param data - Adapted file data
 * @returns Object with available download URLs
 * 
 * @example
 * ```typescript
 * const downloads = getAvailableDownloads(adaptedData);
 * downloads.audio    // audio URL or null
 * downloads.presentation  // presentation URL or null
 * downloads.summaryPdf    // summary PDF URL or null
 * ```
 */
export function getAvailableDownloads(data: AdaptedFileData): {
  audio: string | null;
  presentation: string | null;
  summaryPdf: string | null;
  graphicalAbstract: string | null;
} {
  return {
    audio: hasAudio(data) ? data.audio_url : null,
    presentation: hasPresentation(data) ? data.presentation_url : null,
    summaryPdf: hasSummaryPDF(data) ? data.summary_pdf_url! : null,
    graphicalAbstract: hasGraphicalAbstract(data) ? data.graphical_abstract_url! : null,
  };
}

/**
 * Format warnings for display
 * 
 * @param data - Adapted file data
 * @returns Formatted warning message or null
 * 
 * @example
 * ```typescript
 * const warningMsg = formatWarnings(adaptedData);
 * if (warningMsg) {
 *   toast({ title: "Warnings", description: warningMsg, variant: "warning" });
 * }
 * ```
 */
export function formatWarnings(data: AdaptedFileData): string | null {
  if (!data.warnings || data.warnings.length === 0) {
    return null;
  }

  if (data.warnings.length === 1) {
    return data.warnings[0];
  }

  return `${data.warnings.length} warnings:\n${data.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}`;
}

/**
 * Create a summary of available features
 * 
 * @param data - Adapted file data
 * @returns Human-readable feature summary
 * 
 * @example
 * ```typescript
 * const summary = getFeatureSummary(adaptedData);
 * console.log(summary); // "Audio ✓, Graphical Abstract ✓, Presentation ✓"
 * ```
 */
export function getFeatureSummary(data: AdaptedFileData): string {
  const features: string[] = [];
  
  if (hasAudio(data)) features.push('Audio ✓');
  if (hasGraphicalAbstract(data)) features.push('Graphical Abstract ✓');
  if (hasPresentation(data)) features.push('Presentation ✓');
  if (hasSummaryPDF(data)) features.push('Summary PDF ✓');
  
  return features.length > 0 
    ? features.join(', ') 
    : 'No additional features available';
}

// ============================================================================
// Export convenience object
// ============================================================================

export default {
  adaptBackendResponse,
  adaptMultipleResponses,
  hasAudio,
  hasPresentation,
  hasGraphicalAbstract,
  hasSummaryPDF,
  getAvailableDownloads,
  formatWarnings,
  getFeatureSummary,
};

