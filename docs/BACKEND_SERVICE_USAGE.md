# PaperSynth Backend Service - Usage Guide

This guide shows how to use the `paperSynthBackend.ts` service to interact with the Python FastAPI backend.

---

## 📦 Import

```typescript
import {
  processPaper,
  checkHealth,
  getStatus,
  downloadFile,
  validatePDFFile,
  formatFileSize,
  isFeatureAvailable,
  type ProcessPaperRequest,
  type ProcessPaperResponse,
} from '@/services/paperSynthBackend';
```

---

## 🔧 Basic Usage

### 1. Process a PDF (Simple)

```typescript
import { processPaper, validatePDFFile } from '@/services/paperSynthBackend';
import { useToast } from '@/hooks/use-toast';

const MyComponent = () => {
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    // Validate first
    const validation = validatePDFFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      // Process the paper
      const result = await processPaper({ file });
      
      toast({
        title: "Success!",
        description: "Paper processed successfully",
      });

      console.log('Summary:', result.summary);
      console.log('Request ID:', result.request_id);
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return <input type="file" accept=".pdf" onChange={(e) => {
    if (e.target.files?.[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }} />;
};
```

### 2. Process with All Options

```typescript
import { processPaper } from '@/services/paperSynthBackend';

const processWithOptions = async (file: File) => {
  const result = await processPaper({
    file: file,
    summary_length: 'medium',      // 'short' | 'medium' | 'long'
    generate_visual: true,         // Generate graphical abstract
    generate_audio: true,          // Generate TTS audio
    sdxl_preset: 'balanced',       // 'fast' | 'balanced' | 'quality'
  });

  return result;
};
```

---

## 🏥 Health Check

```typescript
import { checkHealth } from '@/services/paperSynthBackend';
import { useEffect, useState } from 'react';

const BackendStatus = () => {
  const [status, setStatus] = useState<string>('checking...');
  const [features, setFeatures] = useState<any>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const health = await checkHealth();
        setStatus(health.status);
        setFeatures(health.features);
      } catch (error) {
        setStatus('offline');
      }
    };

    checkBackend();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <p>Backend Status: {status}</p>
      {features && (
        <>
          <p>SDXL: {features.sdxl_available ? '✓' : '✗'}</p>
          <p>TTS: {features.tts_available ? '✓' : '✗'}</p>
        </>
      )}
    </div>
  );
};
```

---

## 📊 Status Polling (Long Operations)

```typescript
import { processPaper, getStatus } from '@/services/paperSynthBackend';
import { useState } from 'react';

const ProcessWithProgress = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');

  const handleProcess = async (file: File) => {
    try {
      // Start processing
      const result = await processPaper({ file });
      const requestId = result.request_id;
      
      setStatus('processing');

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await getStatus(requestId);
          
          setProgress(statusResponse.progress || 0);
          setStatus(statusResponse.status);

          if (statusResponse.status === 'completed') {
            clearInterval(pollInterval);
            console.log('Complete!', statusResponse.result);
          } else if (statusResponse.status === 'failed') {
            clearInterval(pollInterval);
            console.error('Failed:', statusResponse.error);
          }
        } catch (error) {
          console.error('Status check failed:', error);
          clearInterval(pollInterval);
        }
      }, 2000); // Poll every 2 seconds

    } catch (error) {
      console.error('Processing failed:', error);
      setStatus('error');
    }
  };

  return (
    <div>
      <p>Status: {status}</p>
      <p>Progress: {progress}%</p>
    </div>
  );
};
```

---

## 💾 File Downloads

```typescript
import { processPaper, downloadFile, isFeatureAvailable } from '@/services/paperSynthBackend';
import { Button } from '@/components/ui/button';

const DownloadResults = () => {
  const [result, setResult] = useState<ProcessPaperResponse | null>(null);

  const handleDownloadPresentation = async () => {
    if (!result?.presentation) return;

    try {
      await downloadFile(result.presentation, 'presentation.pptx');
    } catch (error: any) {
      alert(`Download failed: ${error.message}`);
    }
  };

  const handleDownloadAudio = async () => {
    if (!result?.voiceover) return;

    try {
      await downloadFile(result.voiceover, 'voiceover.mp3');
    } catch (error: any) {
      alert(`Download failed: ${error.message}`);
    }
  };

  const handleDownloadSummaryPDF = async () => {
    if (!result?.summary_pdf) return;

    try {
      await downloadFile(result.summary_pdf, 'summary.pdf');
    } catch (error: any) {
      alert(`Download failed: ${error.message}`);
    }
  };

  return (
    <div>
      {result && (
        <>
          <Button onClick={handleDownloadPresentation}>
            Download Presentation
          </Button>
          
          {isFeatureAvailable(result, 'tts') && result.voiceover && (
            <Button onClick={handleDownloadAudio}>
              Download Audio
            </Button>
          )}

          {result.summary_pdf && (
            <Button onClick={handleDownloadSummaryPDF}>
              Download Summary PDF
            </Button>
          )}
        </>
      )}
    </div>
  );
};
```

---

## 📝 Complete Example: Update MainApp.tsx

Here's how to integrate the service into your existing `MainApp.tsx`:

```typescript
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PDFUpload } from '@/components/PDFUpload';
import { useToast } from '@/hooks/use-toast';
import {
  processPaper,
  validatePDFFile,
  downloadFile,
  isFeatureAvailable,
  type ProcessPaperResponse,
} from '@/services/paperSynthBackend';

export const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<ProcessPaperResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const handleFileUpload = async (file: File) => {
    // Validate file
    const validation = validatePDFFile(file, 10); // 10MB max
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
      const result = await processPaper({
        file: file,
        summary_length: 'medium',
        generate_visual: true,
        generate_audio: true,
        sdxl_preset: 'balanced',
      });
      
      setUploadedFile(result);
      setActiveTab('summary');
      
      toast({
        title: "Processing complete!",
        description: `${file.name} has been successfully analyzed.`,
      });

      // Log warnings if any
      if (result.warnings.length > 0) {
        console.warn('Processing warnings:', result.warnings);
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

  const handleDownload = async (type: 'presentation' | 'audio' | 'pdf') => {
    if (!uploadedFile) return;

    try {
      switch (type) {
        case 'presentation':
          if (uploadedFile.presentation) {
            await downloadFile(uploadedFile.presentation, 'presentation.pptx');
            toast({
              title: "Download started",
              description: "Your presentation is being downloaded.",
            });
          }
          break;
        case 'audio':
          if (uploadedFile.voiceover && isFeatureAvailable(uploadedFile, 'tts')) {
            await downloadFile(uploadedFile.voiceover, 'voiceover.mp3');
            toast({
              title: "Download started",
              description: "Your audio is being downloaded.",
            });
          }
          break;
        case 'pdf':
          if (uploadedFile.summary_pdf) {
            await downloadFile(uploadedFile.summary_pdf, 'summary.pdf');
            toast({
              title: "Download started",
              description: "Your summary PDF is being downloaded.",
            });
          }
          break;
      }
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-deep-black">
      {/* Your existing UI */}
      <PDFUpload onFileUpload={handleFileUpload} />
      
      {uploadedFile && (
        <div>
          <h3>Summary</h3>
          <p>{uploadedFile.summary}</p>

          <button onClick={() => handleDownload('presentation')}>
            Download Presentation
          </button>

          {isFeatureAvailable(uploadedFile, 'tts') && uploadedFile.voiceover && (
            <button onClick={() => handleDownload('audio')}>
              Download Audio
            </button>
          )}

          {uploadedFile.summary_pdf && (
            <button onClick={() => handleDownload('pdf')}>
              Download Summary PDF
            </button>
          )}

          {/* Show warnings if any */}
          {uploadedFile.warnings.length > 0 && (
            <div className="warnings">
              {uploadedFile.warnings.map((warning, idx) => (
                <p key={idx}>{warning}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## 🎨 Feature Availability Checks

```typescript
import { isFeatureAvailable, type ProcessPaperResponse } from '@/services/paperSynthBackend';

const ResultsDisplay = ({ result }: { result: ProcessPaperResponse }) => {
  return (
    <div>
      {/* Always available */}
      <div>Summary: {result.summary}</div>
      <div>Presentation: {result.presentation || 'Not available'}</div>

      {/* Conditional features */}
      {isFeatureAvailable(result, 'sdxl') && result.graphical_abstract && (
        <div>
          <img src={result.graphical_abstract} alt="Graphical Abstract" />
        </div>
      )}

      {isFeatureAvailable(result, 'tts') && result.voiceover && (
        <audio controls src={result.voiceover}>
          Your browser does not support audio playback.
        </audio>
      )}

      {/* Show speaker notes if available */}
      {result.speaker_notes && (
        <div>
          <h4>Speaker Notes</h4>
          <pre>{result.speaker_notes}</pre>
        </div>
      )}
    </div>
  );
};
```

---

## 🛡️ Error Handling Patterns

### Pattern 1: User-Friendly Errors

```typescript
import { processPaper } from '@/services/paperSynthBackend';
import { useToast } from '@/hooks/use-toast';

const safeProcessPaper = async (file: File) => {
  const { toast } = useToast();

  try {
    return await processPaper({ file });
  } catch (error: any) {
    // Error message is already extracted by the service
    toast({
      title: "Processing Failed",
      description: error.message,
      variant: "destructive",
    });
    return null;
  }
};
```

### Pattern 2: Specific Error Handling

```typescript
import { processPaper } from '@/services/paperSynthBackend';

const processWithDetailedErrors = async (file: File) => {
  try {
    return await processPaper({ file });
  } catch (error: any) {
    // Check for specific error messages
    if (error.message.includes('size exceeds')) {
      alert('File is too large. Please use a smaller PDF.');
    } else if (error.message.includes('invalid format')) {
      alert('This PDF format is not supported.');
    } else if (error.message.includes('rate limit')) {
      alert('Too many requests. Please wait a moment and try again.');
    } else {
      alert(`Error: ${error.message}`);
    }
    throw error;
  }
};
```

---

## 📱 React Hook Example

```typescript
import { useState } from 'react';
import { processPaper, type ProcessPaperResponse } from '@/services/paperSynthBackend';

export const usePaperProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessPaperResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const process = async (file: File, options = {}) => {
    setProcessing(true);
    setError(null);
    
    try {
      const data = await processPaper({ file, ...options });
      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setProcessing(false);
  };

  return {
    process,
    processing,
    result,
    error,
    reset,
  };
};

// Usage in component:
const MyComponent = () => {
  const { process, processing, result, error } = usePaperProcessor();

  const handleUpload = async (file: File) => {
    try {
      await process(file, {
        summary_length: 'medium',
        generate_audio: true,
      });
    } catch (err) {
      // Error is already stored in the hook
    }
  };

  return (
    <div>
      {processing && <p>Processing...</p>}
      {error && <p>Error: {error}</p>}
      {result && <p>Summary: {result.summary}</p>}
    </div>
  );
};
```

---

## 🔍 TypeScript Type Checking

All functions are fully typed:

```typescript
import type {
  ProcessPaperRequest,
  ProcessPaperResponse,
  HealthCheckResponse,
  StatusCheckResponse,
} from '@/services/paperSynthBackend';

// TypeScript will enforce correct types
const request: ProcessPaperRequest = {
  file: myFile,
  summary_length: 'medium', // Type-checked: must be 'short' | 'medium' | 'long'
  generate_visual: true,     // Type-checked: must be boolean
};

// Response is fully typed
const response: ProcessPaperResponse = await processPaper(request);
console.log(response.summary);        // string
console.log(response.voiceover);      // string | null
console.log(response.features.sdxl);  // boolean
```

---

## 📋 Validation Helpers

```typescript
import { validatePDFFile, formatFileSize } from '@/services/paperSynthBackend';

const FileUploadWithValidation = () => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validation = validatePDFFile(file, 10); // 10MB max
    
    if (!validation.valid) {
      alert(validation.error);
      e.target.value = ''; // Clear input
      return;
    }

    // Show file info
    console.log(`File: ${file.name}`);
    console.log(`Size: ${formatFileSize(file.size)}`);
    
    // Proceed with upload
    handleUpload(file);
  };

  return <input type="file" accept=".pdf" onChange={handleFileChange} />;
};
```

---

## ✅ Best Practices

1. **Always validate files** before processing
2. **Handle errors gracefully** with user-friendly messages
3. **Check feature availability** before showing UI elements
4. **Use proper TypeScript types** for type safety
5. **Show processing feedback** to users
6. **Handle long operations** with progress indicators
7. **Clean up resources** (intervals, timeouts) on unmount

---

## 🚀 Ready to Use!

The service is fully configured and ready to integrate with your FastAPI backend. All functions automatically:
- ✅ Add authentication headers
- ✅ Handle FormData for file uploads
- ✅ Extract FastAPI error messages
- ✅ Log detailed information in development
- ✅ Provide TypeScript type safety

Simply import and use! 🎉

