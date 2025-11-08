# CORS Error Fix

## Problem
The error occurred because:
1. **Credentials conflict**: When `credentials: true` is set, you cannot use `origin: '*'` in CORS configuration
2. **Preflight requests**: OPTIONS requests (preflight) weren't being handled correctly
3. **Missing headers**: The `Access-Control-Allow-Origin` header wasn't being set correctly for credentialed requests

## Solution Applied

### 1. Updated CORS Configuration
- Changed from `origin: '*'` to a dynamic origin function
- Added explicit handling for the Netlify domain: `https://upvc-admin-panel.netlify.app`
- Maintained support for local development origins

### 2. Added Explicit OPTIONS Handler
- Added explicit `app.options('*', ...)` handler for preflight requests
- Ensures the actual origin is returned (not '*') when credentials are enabled
- Sets all required CORS headers correctly

### 3. Key Changes
```javascript
// Before (didn't work with credentials: true)
origin: '*'

// After (works with credentials: true)
origin: function (origin, callback) {
  // Returns actual origin, not '*'
  callback(null, true);
}
```

## Deployment Steps

1. **Push changes to GitHub:**
```bash
cd UPVC_Backend
git add app.js
git commit -m "Fix CORS for Netlify deployment"
git push origin main
```

2. **Redeploy on Render:**
   - Render will automatically detect the push and redeploy
   - Or manually trigger a redeploy in Render dashboard

3. **Verify:**
   - Check that the Netlify frontend can now make requests
   - Check browser console for CORS errors (should be gone)

## Allowed Origins

Currently allowed:
- `https://upvc-admin-panel.netlify.app` (Production Netlify)
- `http://localhost:5173` (Local Vite dev server)
- `http://localhost:3000` (Local React dev server)
- `http://localhost:8081` (Local alternative port)

To add more origins, update the `allowedOrigins` array in `app.js`.

## Testing

After deployment, test the login:
1. Go to `https://upvc-admin-panel.netlify.app`
2. Try to login
3. Check browser console - should see no CORS errors
4. Check Network tab - OPTIONS request should return 204 with correct headers

## Important Notes

- **Credentials**: When `credentials: true`, the origin must be the actual origin, not '*'
- **Preflight**: OPTIONS requests must be handled before the actual request
- **Headers**: All required headers must be in `allowedHeaders`
- **Security**: In production, consider restricting to only specific origins

