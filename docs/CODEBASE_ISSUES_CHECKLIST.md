# 🔍 PaperSynth Codebase Issues Checklist

**Generated:** November 16, 2025  
**Status:** Comprehensive scan completed

---

## 🚨 **CRITICAL ISSUES** (Must Fix to Make App Work)

### ❌ **1. Authentication Header Mismatch**

**Priority:** 🔴 BLOCKER  
**File:** `src/lib/api.ts`  
**Lines:** 71-79

**Problem:**
- Backend expects: `Authorization: Bearer <API_AUTH_TOKEN>`
- Frontend sends: `X-API-Token: <API_AUTH_TOKEN>` (WRONG!)
- Frontend also sends: `Authorization: Bearer <JWT>` (WRONG TOKEN!)

**Current Code:**
```typescript
// ❌ WRONG - Backend doesn't check X-API-Token header
if (API_AUTH_TOKEN && config.headers) {
  config.headers['X-API-Token'] = API_AUTH_TOKEN;
}

// ❌ WRONG - Sending JWT token, backend expects API_AUTH_TOKEN
const jwtToken = getToken();
if (jwtToken && config.headers) {
  config.headers.Authorization = `Bearer ${jwtToken}`;
}
```

**Fix:**
```typescript
// ✅ CORRECT - Send API_AUTH_TOKEN in Authorization header
if (API_AUTH_TOKEN && config.headers) {
  config.headers.Authorization = `Bearer ${API_AUTH_TOKEN}`;
}

// Remove or comment out JWT token sending (not used for backend API)
// const jwtToken = getToken();
// if (jwtToken && config.headers) {
//   config.headers.Authorization = `Bearer ${jwtToken}`;
// }
```

**Impact:** All API requests to backend will fail with 401/403 errors until fixed.

**Testing:** After fix, test with a PDF upload to verify authentication works.

---

## ⚠️ **HIGH PRIORITY ISSUES**

### ❌ **2. Missing .env.example File**

**Priority:** 🟠 High  
**Location:** Project root

**Problem:** No template file for frontend environment variables.

**Action:** Create `.env.example` in project root:

```env
# Frontend Environment Variables
# Vite requires variables to be prefixed with VITE_

# API Base URL - Backend server endpoint
VITE_API_BASE_URL=http://localhost:8000

# API Auth Token - Must match backend API_AUTH_TOKEN
VITE_API_AUTH_TOKEN=your_dev_token_here
```

**Instructions for developers:**
1. Copy `.env.example` to `.env`
2. Replace `your_dev_token_here` with actual token
3. Ensure token matches backend's `API_AUTH_TOKEN`

---

### ❌ **3. Missing backend.env.example File**

**Priority:** 🟠 High  
**Location:** Project root

**Problem:** No template file for backend environment variables.

**Action:** Create `backend.env.example` in project root:

```env
# Backend Environment Variables
# Python FastAPI Configuration

# AI/ML API Keys
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
HUGGINGFACE_API_TOKEN=your_huggingface_token_here

# Authentication - Must match frontend VITE_API_AUTH_TOKEN
API_AUTH_TOKEN=your_dev_token_here

# CORS Configuration
ALLOWED_CORS_ORIGINS=http://localhost:3000

# Feature Flags
ENABLE_SDXL=false
ENABLE_TTS=false

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10
CONCURRENCY_LIMIT=2

# Optional: Memory and cleanup settings
MIN_MEMORY_GB=1.0
MEMORY_WARNING_THRESHOLD=0.85
TEMP_TTL_HOURS=24
TEMP_SIZE_CAP_GB=1
MAX_PDF_PAGES=100
MAX_TEXT_CHARS=800000
```

**Instructions for developers:**
1. Copy `backend.env.example` to `backend.env`
2. Add your actual API keys
3. Set `API_AUTH_TOKEN` to match frontend token

---

### ❌ **4. Type Inconsistency in Backend Adapter**

**Priority:** 🟠 High  
**File:** `src/services/backendAdapter.ts`  
**Lines:** 144-145

**Problem:** Redundant null handling - `nullToUndefined()` converts `null` → `undefined`, then `|| ''` converts `undefined` → `''`.

**Current Code:**
```typescript
audio_url: nullToUndefined(backendResponse.voiceover) || '',
presentation_url: nullToUndefined(backendResponse.presentation) || '',
```

**Fix Option 1 (Recommended - Consistent with type):**
```typescript
// Use empty string for consistency with FileData type
audio_url: backendResponse.voiceover || '',
presentation_url: backendResponse.presentation || '',
```

**Fix Option 2 (If you want undefined for missing values):**
```typescript
// Return undefined when null (no fallback)
audio_url: nullToUndefined(backendResponse.voiceover) ?? '',
presentation_url: nullToUndefined(backendResponse.presentation) ?? '',
```

**Impact:** Minor - doesn't break functionality but improves code clarity.

---

## 📝 **MEDIUM PRIORITY ISSUES**

### ❌ **5. Outdated Documentation Endpoint**

**Priority:** 🟡 Medium  
**File:** `docs/INTEGRATION_STATUS.md`  
**Line:** 329

**Problem:** Documentation shows wrong endpoint.

**Current:**
```http
POST http://localhost:8000/process
```

**Fix:**
```http
POST http://localhost:8000/process-paper/
```

**Impact:** Developers following docs will get 404 errors.

---

### ❌ **6. Missing Python Requirements File**

**Priority:** 🟡 Medium  
**Location:** Project root

**Problem:** No `requirements.txt` for Python dependencies.

**Action:** Create `requirements.txt` in project root:

```txt
# FastAPI and Server
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-multipart==0.0.9

# Environment and Configuration
python-dotenv==1.0.1

# PDF Processing
PyMuPDF==1.24.0

# Office Documents
python-pptx==1.0.0
fpdf==1.7.2

# AI/ML
google-generativeai==0.8.0
elevenlabs==1.0.0
torch==2.0.0
diffusers==0.30.0
transformers==4.40.0

# System Monitoring
psutil==5.9.0

# Additional
requests==2.31.0
```

**Installation command:**
```bash
pip install -r requirements.txt
```

---

### ❌ **7. Audio Playback Not Implemented**

**Priority:** 🟡 Medium  
**File:** `src/pages/MainApp.tsx`  
**Lines:** 149-156

**Problem:** Audio playback is just a placeholder with TODO comment.

**Current Code:**
```typescript
const handleAudioPlay = () => {
  setIsPlaying(!isPlaying);
  // TODO: Implement actual audio playback
  toast({
    title: isPlaying ? "Audio paused" : "Audio playing",
    description: "Audio playback functionality will be implemented...",
  });
};
```

**Suggested Fix:** Add HTML5 audio element:

```typescript
const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

const handleAudioPlay = () => {
  if (!uploadedFile?.audio_url) return;
  
  if (!audioElement) {
    const audio = new Audio(uploadedFile.audio_url);
    audio.onended = () => setIsPlaying(false);
    setAudioElement(audio);
    audio.play();
    setIsPlaying(true);
  } else {
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  }
};
```

**Impact:** Users can download audio but can't play it in-browser.

---

## ℹ️ **LOW PRIORITY / OPTIONAL**

### ⚪ **8. TypeScript Strict Mode Disabled**

**Priority:** ⚪ Low  
**File:** `tsconfig.json`  
**Lines:** 9-14

**Current:**
```json
{
  "noImplicitAny": false,
  "noUnusedParameters": false,
  "noUnusedLocals": false,
  "strictNullChecks": false
}
```

**Suggestion:** Enable gradually for better type safety:
1. Enable `strictNullChecks` first
2. Fix any errors
3. Enable `noImplicitAny` next
4. Continue with others

**Impact:** Better code quality and fewer runtime errors.

---

### ⚪ **9. Backend Script Could Be More Robust**

**Priority:** ⚪ Low  
**File:** `package.json`  
**Line:** 12

**Current:**
```json
"backend": "uvicorn main:app --reload --port 8000"
```

**Enhanced:**
```json
"backend": "uvicorn main:app --reload --port 8000 --host 0.0.0.0"
```

**Benefit:** Makes backend accessible from other devices on local network.

---

## ✅ **WHAT'S WORKING WELL**

- ✅ No linter errors
- ✅ Comprehensive TypeScript types
- ✅ Good error handling
- ✅ Clean code organization
- ✅ Extensive documentation
- ✅ CORS properly configured
- ✅ Rate limiting implemented
- ✅ File validation (client + server)
- ✅ 5-minute timeout for long operations
- ✅ Comprehensive logging

---

## 🎯 **RECOMMENDED FIX ORDER**

1. **CRITICAL** 🔴 Fix authentication header (Issue #1)
2. **HIGH** 🟠 Create .env.example (Issue #2)
3. **HIGH** 🟠 Create backend.env.example (Issue #3)
4. **HIGH** 🟠 Fix type inconsistency in adapter (Issue #4)
5. **MEDIUM** 🟡 Update documentation endpoint (Issue #5)
6. **MEDIUM** 🟡 Create requirements.txt (Issue #6)
7. **MEDIUM** 🟡 Implement audio playback (Issue #7)
8. **LOW** ⚪ Enhance backend script (Issue #9)
9. **LOW** ⚪ Enable TypeScript strict mode (Issue #8)

---

## 📊 **Summary**

| Priority | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 1 | ❌ Blocks app functionality |
| 🟠 High | 3 | ⚠️ Important for dev experience |
| 🟡 Medium | 3 | 📝 Should fix soon |
| ⚪ Low | 2 | 💡 Code quality improvements |
| **Total** | **9** | **Ready to fix** |

---

## 🧪 **Testing After Fixes**

After fixing Issue #1 (authentication), test:

1. Start backend: `npm run backend`
2. Start frontend: `npm run dev`
3. Upload a test PDF
4. Check browser DevTools Network tab
5. Verify request shows: `Authorization: Bearer <your_token>`
6. Verify response is 200 (not 401/403)
7. Check that summary displays

---

**Last Updated:** November 16, 2025  
**Next Review:** After critical fixes are applied

