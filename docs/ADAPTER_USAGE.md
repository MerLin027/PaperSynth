# Backend Adapter - Usage Guide

The adapter transforms backend responses to frontend-compatible format automatically.

---

## 🎯 Problem Solved

**Backend** returns:
```typescript
{
  request_id: "uuid-123",
  voiceover: "https://backend.com/audio.mp3",
  presentation: "https://backend.com/slides.pptx",
  summary_pdf: "https://backend.com/summary.pdf",
  graphical_abstract: "https://backend.com/abstract.png",
  // ...
}
```

**Frontend** expects:
```typescript
{
  file_id: "uuid-123",
  audio_url: "https://backend.com/audio.mp3",
  presentation_url: "https://backend.com/slides.pptx",
  name: "research-paper.pdf",
  size: 2048576,
  pages: 29,
  // ...
}
```

**Adapter** bridges the gap automatically! ✨

---

## 📦 Import

```typescript
import {
  adaptBackendResponse,
  hasAudio,
  hasPresentation,
  hasGraphicalAbstract,
  hasSummaryPDF,
  getAvailableDownloads,
  formatWarnings,
  type AdaptedFileData,
} from '@/services/backendAdapter';
```

---

## 🚀 Basic Usage

### Simple Adaptation

```typescript
import { processPaper } from '@/services/paperSynthBackend';
import { adaptBackendResponse } from '@/services/backendAdapter';

const handleUpload = async (file: File) => {
  // 1. Get backend response
  const backendResponse = await processPaper({ file });
  
  // 2. Adapt to frontend format
  const frontendData = adaptBackendResponse(backendResponse, file);
  
  // 3. Use with your components
  setUploadedFile(frontendData);
  
  // Access with frontend field names
  console.log(frontendData.file_id);          // ✅ (was request_id)
  console.log(frontendData.audio_url);        // ✅ (was voiceover)
  console.log(frontendData.presentation_url); // ✅ (was presentation)
  console.log(frontendData.name);             // ✅ (from File object)
  console.log(frontendData.pages);            // ✅ (estimated)
};
```

---

## 🔧 Field Mapping Reference

| Backend Field | Frontend Field | Notes |
|--------------|----------------|-------|
| `request_id` | `file_id` | Direct mapping |
| `summary` | `summary` | No change |
| `voiceover` | `audio_url` | null → empty string |
| `presentation` | `presentation_url` | null → empty string |
| `summary_pdf` | `summary_pdf_url` | null → undefined |
| `graphical_abstract` | `graphical_abstract_url` | null → undefined |
| `speaker_notes` | `speaker_notes` | null → undefined |
| `warnings` | `warnings` | Empty array → undefined |
| `features` | `features` | Direct copy |
| N/A | `name` | From File.name |
| N/A | `size` | From File.size |
| N/A | `pages` | Estimated from size |
| N/A | `uploaded_at` | Current timestamp |
| N/A | `metadata` | Generated from file |

---

## 📝 Complete Example: Update MainApp.tsx

```typescript
import React, { useState } from 'react';
import { processPaper, validatePDFFile } from '@/services/paperSynthBackend';
import { adaptBackendResponse, type AdaptedFileData, hasAudio, hasPresentation } from '@/services/backendAdapter';
import { PDFUpload } from '@/components/PDFUpload';
import { useToast } from '@/hooks/use-toast';

export const MainApp: React.FC = () => {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<AdaptedFileData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (file: File) => {
    // Validate
    const validation = validatePDFFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Process with backend
      const backendResult = await processPaper({
        file: file,
        summary_length: 'medium',
        generate_visual: true,
        generate_audio: true,
      });
      
      // ✨ Adapt to frontend format
      const adaptedData = adaptBackendResponse(backendResult, file);
      
      setUploadedFile(adaptedData);
      
      toast({
        title: "Processing complete!",
        description: `${adaptedData.name} has been successfully analyzed.`,
      });

      // Show warnings if any
      if (adaptedData.warnings && adaptedData.warnings.length > 0) {
        console.warn('Processing warnings:', adaptedData.warnings);
        toast({
          title: "Note",
          description: `Processing completed with ${adaptedData.warnings.length} warning(s)`,
          variant: "default",
        });
      }
      
    } catch (error: any) {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PDFUpload onFileUpload={handleFileUpload} />
      
      {uploadedFile && (
        <div className="results">
          {/* File Info */}
          <h2>{uploadedFile.name}</h2>
          <p>{uploadedFile.size} bytes • {uploadedFile.pages} pages</p>
          
          {/* Summary */}
          <div>{uploadedFile.summary}</div>
          
          {/* Conditional Features */}
          {hasAudio(uploadedFile) && (
            <audio controls src={uploadedFile.audio_url}>
              Your browser does not support audio.
            </audio>
          )}
          
          {hasPresentation(uploadedFile) && (
            <a href={uploadedFile.presentation_url} download>
              Download Presentation
            </a>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## 🎛️ Helper Functions

### Check Feature Availability

```typescript
import {
  hasAudio,
  hasPresentation,
  hasGraphicalAbstract,
  hasSummaryPDF
} from '@/services/backendAdapter';

const ResultsDisplay = ({ data }: { data: AdaptedFileData }) => {
  return (
    <div>
      {/* Audio Player - only show if available */}
      {hasAudio(data) && (
        <audio controls src={data.audio_url}>
          Your browser does not support audio playback.
        </audio>
      )}
      
      {/* Graphical Abstract - only show if available */}
      {hasGraphicalAbstract(data) && (
        <img 
          src={data.graphical_abstract_url} 
          alt="Graphical Abstract"
          className="w-full max-w-2xl"
        />
      )}
      
      {/* Download Buttons - only show if available */}
      {hasPresentation(data) && (
        <button onClick={() => download(data.presentation_url)}>
          Download Presentation
        </button>
      )}
      
      {hasSummaryPDF(data) && (
        <button onClick={() => download(data.summary_pdf_url!)}>
          Download Summary PDF
        </button>
      )}
    </div>
  );
};
```

### Get All Available Downloads

```typescript
import { getAvailableDownloads } from '@/services/backendAdapter';

const DownloadSection = ({ data }: { data: AdaptedFileData }) => {
  const downloads = getAvailableDownloads(data);
  
  return (
    <div>
      <h3>Available Downloads:</h3>
      
      {downloads.audio && (
        <button onClick={() => downloadFile(downloads.audio!, 'audio.mp3')}>
          Download Audio
        </button>
      )}
      
      {downloads.presentation && (
        <button onClick={() => downloadFile(downloads.presentation!, 'presentation.pptx')}>
          Download Presentation
        </button>
      )}
      
      {downloads.summaryPdf && (
        <button onClick={() => downloadFile(downloads.summaryPdf!, 'summary.pdf')}>
          Download Summary PDF
        </button>
      )}
      
      {downloads.graphicalAbstract && (
        <button onClick={() => downloadFile(downloads.graphicalAbstract!, 'abstract.png')}>
          Download Graphical Abstract
        </button>
      )}
    </div>
  );
};
```

### Format Warnings

```typescript
import { formatWarnings } from '@/services/backendAdapter';

const WarningsDisplay = ({ data }: { data: AdaptedFileData }) => {
  const warningMessage = formatWarnings(data);
  
  if (!warningMessage) return null;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
      <h4 className="font-semibold">Processing Warnings:</h4>
      <p className="whitespace-pre-line">{warningMessage}</p>
    </div>
  );
};
```

### Feature Summary

```typescript
import { getFeatureSummary } from '@/services/backendAdapter';

const FeatureBadge = ({ data }: { data: AdaptedFileData }) => {
  const summary = getFeatureSummary(data);
  
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
      <span className="text-sm text-blue-800">{summary}</span>
    </div>
  );
};
```

---

## 🔄 Batch Processing

```typescript
import { adaptMultipleResponses } from '@/services/backendAdapter';
import { processPaper } from '@/services/paperSynthBackend';

const processBatch = async (files: File[]) => {
  // Process all files
  const backendResults = await Promise.all(
    files.map(file => processPaper({ file }))
  );
  
  // Adapt all responses at once
  const adaptedResults = adaptMultipleResponses(backendResults, files);
  
  return adaptedResults;
};

// Usage
const files = [file1, file2, file3];
const results = await processBatch(files);
results.forEach(result => {
  console.log(result.name, result.file_id, result.audio_url);
});
```

---

## 📊 Type Safety

The adapter provides full TypeScript support:

```typescript
import type { AdaptedFileData } from '@/services/backendAdapter';

// Fully typed
const data: AdaptedFileData = adaptBackendResponse(backendResult, file);

// TypeScript knows all fields
data.file_id;              // string
data.name;                 // string
data.size;                 // number
data.pages;                // number
data.summary;              // string
data.audio_url;            // string
data.presentation_url;     // string
data.summary_pdf_url;      // string | undefined
data.graphical_abstract_url; // string | undefined
data.speaker_notes;        // string | undefined
data.warnings;             // string[] | undefined
data.features;             // { sdxl: boolean, tts: boolean, signed_downloads: boolean }
data.metadata;             // FileMetadata | undefined
data.uploaded_at;          // Date | undefined
```

---

## 🎨 Extended Data Fields

The adapter preserves ALL backend fields while adding frontend-required fields:

```typescript
const adapted = adaptBackendResponse(backendResult, file);

// Frontend fields (required by components)
adapted.file_id
adapted.name
adapted.size
adapted.pages
adapted.summary
adapted.audio_url
adapted.presentation_url

// Backend-specific fields (preserved)
adapted.summary_pdf_url
adapted.graphical_abstract_url
adapted.speaker_notes
adapted.warnings
adapted.features

// Generated fields
adapted.uploaded_at
adapted.metadata
```

---

## 🧮 Page Estimation Logic

The adapter estimates page count based on file size:

```typescript
// Average PDF page: ~70KB (text + images)
const estimatedPages = Math.ceil(fileSize / (70 * 1024));

// Clamped between 1 and 1000 pages
const pages = Math.max(1, Math.min(estimatedPages, 1000));
```

**Examples:**
- 350KB file → ~5 pages
- 1.4MB file → ~20 pages
- 7MB file → ~100 pages

If you get actual page count from the backend later, you can override this.

---

## 🔍 Null Handling

The adapter converts `null` to appropriate values:

| Backend Value | Frontend Value | Reason |
|--------------|----------------|--------|
| `null` for required URLs | Empty string `""` | Frontend expects string |
| `null` for optional URLs | `undefined` | Frontend expects undefined |
| Empty `warnings` array | `undefined` | Cleaner checks |

**Example:**
```typescript
// Backend returns
{ voiceover: null, graphical_abstract: null }

// Adapter produces
{ audio_url: "", graphical_abstract_url: undefined }

// Now you can check
if (data.audio_url) { ... }              // Works
if (data.graphical_abstract_url) { ... } // Works
```

---

## 🎯 Real-World Usage Pattern

```typescript
import { processPaper, validatePDFFile } from '@/services/paperSynthBackend';
import { 
  adaptBackendResponse, 
  hasAudio, 
  formatWarnings,
  getAvailableDownloads 
} from '@/services/backendAdapter';

const uploadAndProcess = async (file: File) => {
  // 1. Validate
  const validation = validatePDFFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Process
  const backendResult = await processPaper({
    file,
    summary_length: 'medium',
    generate_audio: true,
    generate_visual: true,
  });

  // 3. Adapt
  const frontendData = adaptBackendResponse(backendResult, file);

  // 4. Handle warnings
  const warnings = formatWarnings(frontendData);
  if (warnings) {
    console.warn(warnings);
  }

  // 5. Check features
  const downloads = getAvailableDownloads(frontendData);
  console.log('Audio available:', !!downloads.audio);
  console.log('Presentation available:', !!downloads.presentation);

  // 6. Return adapted data
  return frontendData;
};
```

---

## ✅ Benefits

1. **Clean Separation** - Backend and frontend use their own conventions
2. **Type Safety** - Full TypeScript support
3. **Null Safety** - Proper null handling
4. **Feature Detection** - Helper functions for availability checks
5. **Maintainability** - Single source of truth for field mapping
6. **Extensibility** - Easy to add new fields or transformations
7. **Testing** - Pure function, easy to test

---

## 🧪 Testing the Adapter

```typescript
import { adaptBackendResponse } from '@/services/backendAdapter';

const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

const mockBackendResponse = {
  request_id: 'test-123',
  summary: 'Test summary',
  voiceover: 'https://example.com/audio.mp3',
  presentation: 'https://example.com/slides.pptx',
  summary_pdf: null,
  graphical_abstract: null,
  features: { sdxl: false, tts: true, signed_downloads: false },
  speaker_notes: null,
  warnings: []
};

const adapted = adaptBackendResponse(mockBackendResponse, testFile);

console.log(adapted.file_id);        // 'test-123'
console.log(adapted.name);           // 'test.pdf'
console.log(adapted.audio_url);      // 'https://example.com/audio.mp3'
console.log(adapted.summary_pdf_url); // undefined
```

---

## 🚀 Summary

The adapter:
- ✅ Transforms `request_id` → `file_id`
- ✅ Transforms `voiceover` → `audio_url`
- ✅ Transforms `presentation` → `presentation_url`
- ✅ Adds `name`, `size` from File object
- ✅ Estimates `pages` from file size
- ✅ Converts `null` to appropriate values
- ✅ Preserves all backend-specific fields
- ✅ Provides helper functions for feature checks
- ✅ Fully typed with TypeScript
- ✅ Zero configuration needed

**Just call `adaptBackendResponse()` and you're done!** 🎉

