# PaperSynth Backend Integration - Quick Reference

## 📁 Files Created

```
project-root/
├── .env                              # Frontend environment variables
├── backend.env                       # Python backend environment variables
├── .gitignore                        # Updated with Python & env excludes
├── package.json                      # Updated with backend scripts
├── src/
│   ├── lib/
│   │   └── api.ts                   # ✨ Updated - FastAPI integration
│   └── services/
│       └── paperSynthBackend.ts     # ✨ New - Backend service layer
├── API_USAGE_GUIDE.md               # Detailed API client guide
├── BACKEND_SERVICE_USAGE.md         # Service integration examples
└── QUICK_REFERENCE.md               # This file
```

---

## 🚀 Quick Start

### 1. Import the Service

```typescript
import {
  processPaper,
  checkHealth,
  validatePDFFile,
  downloadFile
} from '@/services/paperSynthBackend';
```

### 2. Process a PDF

```typescript
const result = await processPaper({
  file: myPdfFile,
  summary_length: 'medium',
  generate_visual: true,
  generate_audio: true,
});

console.log(result.summary);
console.log(result.presentation);
console.log(result.voiceover);
```

### 3. Handle Errors

```typescript
try {
  const result = await processPaper({ file });
} catch (error) {
  // Error message is automatically extracted from FastAPI
  alert(error.message);
}
```

---

## 📋 Available Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `processPaper(request)` | Upload & process PDF | `ProcessPaperResponse` |
| `checkHealth()` | Check backend status | `HealthCheckResponse` |
| `getStatus(requestId)` | Poll processing status | `StatusCheckResponse` |
| `downloadFile(url, filename)` | Download generated files | `Promise<void>` |
| `validatePDFFile(file, maxMB)` | Client-side validation | `{valid, error?}` |
| `formatFileSize(bytes)` | Format bytes to readable | `string` |
| `isFeatureAvailable(result, feature)` | Check feature flags | `boolean` |

---

## 🔧 ProcessPaperRequest Options

```typescript
{
  file: File;                              // Required
  summary_length?: 'short' | 'medium' | 'long';
  generate_visual?: boolean;               // Graphical abstract
  generate_audio?: boolean;                // TTS voiceover
  sdxl_preset?: 'fast' | 'balanced' | 'quality';
}
```

---

## 📤 ProcessPaperResponse Structure

```typescript
{
  request_id: string;
  summary: string;
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
```

---

## 🎯 Common Patterns

### Upload with Validation

```typescript
const upload = async (file: File) => {
  const validation = validatePDFFile(file);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }
  
  const result = await processPaper({ file });
  return result;
};
```

### Check Backend Health

```typescript
const health = await checkHealth();
if (health.status === 'ok') {
  console.log('Backend is running');
}
```

### Download Files

```typescript
if (result.presentation) {
  await downloadFile(result.presentation, 'presentation.pptx');
}

if (result.voiceover) {
  await downloadFile(result.voiceover, 'audio.mp3');
}
```

### Check Features

```typescript
if (isFeatureAvailable(result, 'tts') && result.voiceover) {
  // Show audio player
}

if (isFeatureAvailable(result, 'sdxl') && result.graphical_abstract) {
  // Show image
}
```

---

## 🔐 Authentication

All requests automatically include:

```http
X-API-Token: dev_token_123              # From .env
Authorization: Bearer <jwt_token>        # If logged in
```

No manual token handling needed! ✨

---

## ⚙️ Environment Variables

### `.env` (Frontend)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_AUTH_TOKEN=dev_token_123
```

### `backend.env` (Backend)
```env
GEMINI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
API_AUTH_TOKEN=dev_token_123
ALLOWED_CORS_ORIGINS=http://localhost:3000
```

---

## 🏃 Running the Stack

```bash
# Frontend + Backend together
npm run dev:full

# Or separately:
npm run dev      # Frontend only (port 3000)
npm run backend  # Backend only (port 8000)
```

---

## 🐛 Error Handling

Errors are automatically extracted from FastAPI's `{"detail": "message"}` format:

```typescript
try {
  await processPaper({ file });
} catch (error) {
  // error.message contains the FastAPI detail message
  console.error(error.message);
}
```

---

## 📊 HTTP Status Codes

| Code | Meaning | Handled |
|------|---------|---------|
| 200 | Success | ✅ Returns data |
| 401 | Unauthorized | ✅ Auto-redirects to login |
| 422 | Validation error | ✅ Extracts validation messages |
| 429 | Rate limited | ✅ Shows retry-after |
| 500 | Server error | ✅ Logs and shows error |

---

## 💡 Pro Tips

1. **Always validate** files before uploading
   ```typescript
   const validation = validatePDFFile(file);
   if (!validation.valid) return;
   ```

2. **Check features** before displaying UI
   ```typescript
   if (isFeatureAvailable(result, 'tts')) {
     // Show audio controls
   }
   ```

3. **Handle warnings** from processing
   ```typescript
   if (result.warnings.length > 0) {
     console.warn(result.warnings);
   }
   ```

4. **Use TypeScript types** for safety
   ```typescript
   import type { ProcessPaperResponse } from '@/services/paperSynthBackend';
   ```

---

## 🧪 Testing

```bash
# 1. Start both servers
npm run dev:full

# 2. Open browser to http://localhost:3000

# 3. Check console for:
🚀 API Request logs
✅ API Response logs
❌ Error logs (if any)

# 4. Test:
- Login/Register
- Upload PDF
- Download files
- Check error handling
```

---

## 📚 Documentation

- **API Client**: See `API_USAGE_GUIDE.md`
- **Service Layer**: See `BACKEND_SERVICE_USAGE.md`
- **Integration**: See `FRONTEND_INTEGRATION_GUIDE.md`

---

## 🎉 That's It!

You're ready to integrate the FastAPI backend with your React frontend!

**Key takeaway**: Import functions from `@/services/paperSynthBackend` and they handle everything automatically - authentication, error extraction, FormData, and more!

```typescript
import { processPaper } from '@/services/paperSynthBackend';

const result = await processPaper({ file: myPDF });
console.log(result.summary); // ✨ Magic!
```

