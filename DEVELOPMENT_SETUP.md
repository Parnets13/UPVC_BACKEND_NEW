# Development Setup Guide

## Current Configuration

Your backend is now configured to use a **separate development database** on MongoDB Atlas:
- **Production DB**: `upvc_production` (used by Render.com)
- **Development DB**: `upvc_development` (used locally)

This keeps your development and production data completely separate.

## Quick Start

### 1. Start the Backend

```bash
cd UPVC_Backend
npm install
npm run dev
```

The backend will start on `http://localhost:9000` and connect to the `upvc_development` database.

### 2. Start the Frontend

```bash
cd upvc_web
npm install
npm run dev
```

The frontend will connect to your local backend at `http://localhost:9000`.

### 3. Upload Your First Advertisement

1. Open `http://localhost:5173/admin/advertisements/buyer`
2. Click "Add Advertisement"
3. Fill in the details and upload a video
4. The video will be saved locally in `UPVC_Backend/uploads/advertisements/`

## Database Configuration

### Current Setup (MongoDB Atlas - Separate Databases)

**File**: `UPVC_Backend/.env`

```env
# Development Database (current)
MONGO_URI=mongodb+srv://akashg250804:NRcNg6GKqorLSIeo@cluster0.7hcgmbi.mongodb.net/upvc_development?retryWrites=true&w=majority&appName=Cluster0
```

### Alternative: Local MongoDB

If you prefer to install MongoDB locally:

1. **Install MongoDB Community Edition**
   - Download from: https://www.mongodb.com/try/download/community
   - Install as Windows Service

2. **Update `.env`**:
   ```env
   MONGO_URI=mongodb://localhost:27017/upvc_local
   ```

3. **Start MongoDB**:
   ```bash
   # MongoDB should start automatically as a service
   # Or manually: mongod
   ```

## Switching Between Environments

### Use Development Database (Local Development)
```env
# UPVC_Backend/.env
MONGO_URI=mongodb+srv://...upvc_development...
```

```env
# upvc_web/.env.local
VITE_API_BASE_URL=http://localhost:9000/api
VITE_UPLOAD_BASE_URL=http://localhost:9000
```

### Use Production Database (Testing Production Data)
```env
# UPVC_Backend/.env
MONGO_URI=mongodb+srv://...upvc_production...
```

```env
# upvc_web/.env.local
VITE_API_BASE_URL=https://upvc-backend-new.onrender.com/api
VITE_UPLOAD_BASE_URL=https://upvc-backend-new.onrender.com
```

## Cleanup Development Data

If you want to start fresh and delete all development advertisements:

```bash
cd UPVC_Backend
node scripts/cleanupAds.js
```

This will delete all advertisements from your current database (development).

## File Storage

- **Development**: Files stored in `UPVC_Backend/uploads/`
- **Production**: Files stored on Render.com's filesystem (ephemeral)

**⚠️ Important**: Render.com's filesystem is ephemeral. For production, consider using:
- AWS S3
- Cloudinary
- DigitalOcean Spaces
- Vercel Blob

## Troubleshooting

### Videos Not Playing

1. **Check the console** - Look for detailed error logs
2. **Verify file exists**: Check `UPVC_Backend/uploads/advertisements/`
3. **Check database**: Ensure you're using the development database
4. **Restart backend**: Sometimes needed after .env changes

### Database Connection Issues

1. **Check MongoDB Atlas**: Ensure your IP is whitelisted
2. **Check credentials**: Verify username/password in connection string
3. **Check network**: Ensure you have internet connection

### Port Already in Use

If port 9000 is already in use:

```bash
# Find process using port 9000
netstat -ano | findstr :9000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## Next Steps

1. ✅ Backend is configured for development
2. ✅ Frontend points to local backend
3. ✅ Separate development database
4. 🎯 **Start both servers and upload a test video!**

## Production Deployment

When deploying to production:

1. Update Render.com environment variables:
   ```
   MONGO_URI=mongodb+srv://...upvc_production...
   ```

2. Deploy your code to Render.com

3. Consider migrating to cloud storage (S3/Cloudinary) for files
