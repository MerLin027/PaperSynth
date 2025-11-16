# PaperSynth API Usage Guide

## Updated `api.ts` Overview

The API client has been updated to work seamlessly with the FastAPI backend with the following enhancements:

### ✅ New Features

1. **Extended Timeout**: 5 minutes (300,000ms) for long PDF processing operations
2. **Backend Auth Token**: Automatically injects `VITE_API_AUTH_TOKEN` as `X-API-Token` header
3. **FastAPI Error Handling**: Properly extracts error messages from `{"detail": "message"}` format
4. **Rate Limit Detection**: Specific handling for 429 errors with retry-after information
5. **Enhanced Logging**: Comprehensive request/response logging in development mode
6. **Helper Function**: `getApiErrorMessage()` for easy error message extraction

---

## Configuration

### Environment Variables (`.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_AUTH_TOKEN=dev_token_123
```

---

## Usage Examples

### 1. Basic API Call with Error Handling

```typescript
import apiClient, { getApiErrorMessage } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const MyComponent = () => {
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/api/endpoint');
      console.log('Success:', response.data);
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
};
```

### 2. File Upload with FormData

```typescript
import apiClient, { getApiErrorMessage } from '@/lib/api';

const uploadPDF = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/summarize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data;
  } catch (error: any) {
    // The error message is automatically extracted from FastAPI's {"detail": "message"}
    const message = getApiErrorMessage(error);
    
    // Check for specific error codes
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds.`);
    }
    
    throw new Error(message);
  }
};
```

### 3. Authentication Endpoints

```typescript
import apiClient, { getApiErrorMessage } from '@/lib/api';

// Login
export const login = async (credentials: { email: string; password: string }) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};

// Register
export const register = async (userData: { email: string; password: string; name?: string }) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
};
```

### 4. Handling Different Error Types

```typescript
import apiClient, { getApiErrorMessage } from '@/lib/api';
import { AxiosError } from 'axios';

const handleAPICall = async () => {
  try {
    const response = await apiClient.get('/api/data');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      
      switch (status) {
        case 401:
          // Already handled by interceptor (redirects to login)
          console.log('User unauthorized');
          break;
        case 403:
          alert('You do not have permission to access this resource');
          break;
        case 404:
          alert('Resource not found');
          break;
        case 422:
          // FastAPI validation errors
          const validationError = getApiErrorMessage(error);
          alert(`Validation failed: ${validationError}`);
          break;
        case 429:
          // Rate limiting
          alert('Too many requests. Please try again later.');
          break;
        case 500:
          alert('Server error. Please contact support.');
          break;
        default:
          alert(getApiErrorMessage(error));
      }
    }
  }
};
```

---

## Headers Sent with Each Request

### Automatic Headers

```typescript
{
  'Content-Type': 'application/json',           // Default (can be overridden)
  'X-API-Token': 'dev_token_123',              // From VITE_API_AUTH_TOKEN
  'Authorization': 'Bearer <jwt_token>'         // From localStorage (if logged in)
}
```

### How to Override Headers

```typescript
// For file uploads
apiClient.post('/api/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// For custom content type
apiClient.post('/api/data', data, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});
```

---

## Error Response Formats

### FastAPI Standard Error

```json
{
  "detail": "File size exceeds maximum allowed size of 10MB"
}
```

**Extracted message**: `"File size exceeds maximum allowed size of 10MB"`

### FastAPI Validation Error (422)

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

**Extracted message**: `"value is not a valid email address"`

### Rate Limit Error (429)

```json
{
  "detail": "Rate limit exceeded"
}
```

**Headers**: `Retry-After: 60`

The interceptor will log: `"Retry after: 60 seconds"`

---

## Development Logging

When running in development mode (`npm run dev`), you'll see detailed logs:

### Request Log Example
```
🚀 API Request:
{
  method: 'POST',
  url: 'http://localhost:8000/api/summarize',
  headers: {
    Authorization: '***',
    X-API-Token: '***',
    Content-Type: 'multipart/form-data'
  },
  data: 'FormData',
  timeout: 300000
}
```

### Success Response Log Example
```
✅ API Response:
{
  status: 200,
  statusText: 'OK',
  url: '/api/summarize',
  data: { file_id: '123', name: 'paper.pdf', ... }
}
```

### Error Log Example
```
❌ API Error Details
  Status: 422
  URL: /api/summarize
  Method: POST
  Message: File size exceeds maximum allowed size of 10MB
  Full Error: { detail: "File size exceeds..." }
  Request Data: FormData
```

---

## Timeout Handling

The API client is configured with a **5-minute timeout** (300,000ms) to accommodate long PDF processing operations.

If a request exceeds this timeout:

```typescript
try {
  const response = await apiClient.post('/api/summarize', formData);
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    console.error('Request timeout - processing took longer than 5 minutes');
    // Handle timeout
  }
}
```

---

## Rate Limiting

The backend is configured with rate limiting (10 requests per minute). When you hit the limit:

```typescript
try {
  const response = await apiClient.get('/api/data');
} catch (error) {
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    console.log(`Wait ${retryAfter} seconds before retrying`);
  }
}
```

---

## Best Practices

### ✅ DO:

1. **Use the helper function** for consistent error messages:
   ```typescript
   const message = getApiErrorMessage(error);
   ```

2. **Check specific status codes** when you need custom handling:
   ```typescript
   if (error.response?.status === 429) { /* handle rate limit */ }
   ```

3. **Use try-catch blocks** for all API calls

4. **Show user-friendly errors** extracted from FastAPI responses

### ❌ DON'T:

1. Don't access `error.message` directly - use `getApiErrorMessage(error)` instead
2. Don't ignore timeout errors - they're likely due to long processing
3. Don't hardcode API URLs - use environment variables
4. Don't expose sensitive tokens in console logs (they're automatically masked)

---

## Testing the API Integration

### 1. Check environment variables
```bash
# In project root
cat .env

# Should show:
# VITE_API_BASE_URL=http://localhost:8000
# VITE_API_AUTH_TOKEN=dev_token_123
```

### 2. Start both servers
```bash
npm run dev:full
```

### 3. Check browser console
Open DevTools → Console and look for:
- `🚀 API Request` logs
- `✅ API Response` or `❌ API Error` logs
- Verify auth tokens are masked as `***`

### 4. Test API endpoints
- Login/Register
- PDF upload
- Check error handling (try uploading large file, etc.)

---

## Troubleshooting

### Issue: "Network Error"
- **Cause**: Backend not running or wrong URL
- **Fix**: Check `.env` file and ensure backend is running on port 8000

### Issue: "401 Unauthorized"
- **Cause**: Invalid or expired JWT token
- **Fix**: Logout and login again

### Issue: "429 Rate Limited"
- **Cause**: Too many requests in short time
- **Fix**: Wait for the `retry-after` duration before retrying

### Issue: "Request Timeout"
- **Cause**: PDF processing took longer than 5 minutes
- **Fix**: Optimize backend processing or increase timeout in `api.ts`

---

## Migration Checklist

If you're updating existing code:

- [ ] Replace `error.response?.data?.detail` with `getApiErrorMessage(error)`
- [ ] Remove manual error message extraction logic
- [ ] Ensure `.env` file exists with required variables
- [ ] Test all API endpoints with the new client
- [ ] Check console logs for proper authentication headers
- [ ] Verify error toasts show FastAPI error messages correctly

---

**Last Updated**: November 2024  
**API Version**: FastAPI Backend v1.0

