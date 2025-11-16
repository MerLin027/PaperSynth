# PaperSynth Frontend Integration Guide
**Quick guide for connecting Python backend to React frontend**

---

## 📋 Quick Overview

**Stack**: React 18 + TypeScript + Vite + Axios  
**Backend**: Python (FastAPI recommended) with JWT auth + CORS  
**Files to modify**: `src/lib/api.ts`, `src/lib/auth.ts`, `src/pages/MainApp.tsx`

---

## 🚀 3-Step Integration

### Step 1: Environment Setup (30 seconds)

Create `.env` in project root:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Step 2: Update Auth Functions (2 minutes)

**File**: `src/lib/auth.ts` (lines 75-145)

Add import:
```typescript
import apiClient from './api';
```

Replace both functions:
```typescript
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    setToken(response.data.access_token);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    setToken(response.data.access_token);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Registration failed');
  }
};
```

### Step 3: Update File Upload (2 minutes)

**File**: `src/pages/MainApp.tsx` (lines 29-76)

Add imports:
```typescript
import apiClient from '@/lib/api';
import { getToken } from '@/lib/auth';
```

Replace `handleFileUpload`:
```typescript
const handleFileUpload = async (file: File) => {
  setIsProcessing(true);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<FileData>('/api/summarize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    setUploadedFile(response.data);
    setActiveTab('summary');
    
    toast({
      title: "Processing complete!",
      description: `${file.name} has been successfully analyzed.`,
    });
  } catch (error: any) {
    toast({
      title: "Processing failed",
      description: error.response?.data?.detail || 'Failed to process PDF',
      variant: "destructive",
    });
  } finally {
    setIsProcessing(false);
  }
};
```

**Done!** Restart dev server: `npm run dev`

---

## 🔌 Required Backend Endpoints

### 1. POST /auth/register
```json
// Request
{ "email": "user@example.com", "password": "pass123", "name": "John" }

// Response (201)
{
  "access_token": "jwt_token",
  "token_type": "bearer",
  "user": { "id": "uuid", "email": "user@example.com", "name": "John" }
}
```

### 2. POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "pass123" }

// Response (200)
{
  "access_token": "jwt_token",
  "token_type": "bearer",
  "user": { "id": "uuid", "email": "user@example.com", "name": "John" }
}
```

### 3. POST /api/summarize
```json
// Request: multipart/form-data
// Header: Authorization: Bearer <token>
// Form field: file (PDF)

// Response (200)
{
  "file_id": "uuid",
  "name": "paper.pdf",
  "size": 2048576,
  "pages": 12,
  "summary": "Research paper summary...",
  "audio_url": "http://api.example.com/files/audio/uuid.mp3",
  "presentation_url": "http://api.example.com/files/pptx/uuid.pptx"
}

// Error (400/413/401)
{ "detail": "Error message" }
```

---

## 🐍 FastAPI Backend Template

Minimal working backend:

```python
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserRegister(BaseModel):
    email: str
    password: str
    name: str = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

@app.post("/auth/register", response_model=AuthResponse)
async def register(user: UserRegister):
    # TODO: Hash password, save to DB, generate JWT
    return {
        "access_token": "jwt_token_here",
        "token_type": "bearer",
        "user": {"id": "user_123", "email": user.email, "name": user.name}
    }

@app.post("/auth/login", response_model=AuthResponse)
async def login(credentials: dict):
    # TODO: Verify credentials, generate JWT
    return {
        "access_token": "jwt_token_here",
        "token_type": "bearer",
        "user": {"id": "user_123", "email": credentials["email"]}
    }

@app.post("/api/summarize")
async def summarize_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files allowed")
    
    # TODO: Process PDF, generate summary, audio, presentation
    return {
        "file_id": "file_123",
        "name": file.filename,
        "size": file.size,
        "pages": 10,
        "summary": "Mock summary...",
        "audio_url": "http://localhost:8000/files/audio/file_123.mp3",
        "presentation_url": "http://localhost:8000/files/pptx/file_123.pptx"
    }
```

Run: `uvicorn main:app --reload --port 8000`

---

## ✅ Testing Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can register new user
- [ ] Can login (token stored in localStorage)
- [ ] Can upload PDF
- [ ] Response data displays correctly
- [ ] CORS configured
- [ ] 401 errors redirect to login

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| **CORS Error** | Add frontend URL to `allow_origins` in backend |
| **401 Unauthorized** | Check `Authorization: Bearer <token>` header format |
| **File upload fails** | Verify form field name is `file` and Content-Type is `multipart/form-data` |
| **Env vars not loading** | Restart Vite dev server, check VITE_ prefix |

---

## 📦 API Client (Already Created)

The file `src/lib/api.ts` handles:
- ✅ Auto JWT token injection
- ✅ 401 auto-redirect to login  
- ✅ Error logging in development
- ✅ Request/response interceptors

---

## 🔒 Security Notes

1. **Token Storage**: Currently localStorage (OK for MVP). For production: httpOnly cookies
2. **File Validation**: Always validate on backend (never trust frontend)
3. **HTTPS**: Use in production
4. **Environment Variables**: Never commit `.env` files

---

## 📚 TypeScript Types

See `src/types/api.types.ts` for complete API type definitions.

---

**Questions?** Check browser DevTools → Network tab for API call details  
**Last Updated**: November 2024

