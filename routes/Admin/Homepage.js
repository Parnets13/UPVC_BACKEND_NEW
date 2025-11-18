const express = require('express');
const router = express.Router();
const multer = require('multer');
const upvcController = require('../../controllers/Admin/HomepageController');
const upload = require('../../middlewares/upload');

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[Homepage Route] ${req.method} ${req.path}`);
  next();
});

// Main content routes
router.get("/", upvcController.getContent);
// For creating homepage
const createUploadMiddleware = upload('advertisements').fields([
  { name: 'videoUrl', maxCount: 1 },
  { name: 'sponsorLogo', maxCount: 1 }
]);

router.post(
  "/",
  (req, res, next) => {
    console.log('[Homepage POST] Route hit - creating homepage');
    next();
  },
  (req, res, next) => {
    createUploadMiddleware(req, res, (err) => {
      if (err) {
        console.log('[Homepage POST] Upload error:', err.message);
        return res.status(400).json({ error: err.message });
      }
      console.log('[Homepage POST] Files uploaded:', req.files);
      next();
    });
  },
  upvcController.createHomepage
);

// Update homepage - handles video and optional sponsor logo
// Make upload optional - allow requests with or without files
const uploadMiddleware = upload('advertisements').fields([
  { name: 'videoUrl', maxCount: 1 },
  { name: 'sponsorLogo', maxCount: 1 }
]);

router.put(
  "/",
  (req, res, next) => {
    console.log('[Homepage PUT] Route hit - Method:', req.method, 'Path:', req.path);
    console.log('[Homepage PUT] Headers:', req.headers);
    next();
  },
  (req, res, next) => {
    // Handle upload, but don't fail if no files
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.log('[Homepage PUT] Upload error (non-fatal):', err.message);
        // Continue even if upload fails (files are optional)
      }
      console.log('[Homepage PUT] After upload - files:', req.files);
      next();
    });
  },
  upvcController.updateHomepage
);
 
// Key moments - use 'heading' folder (same as other thumbnails) or create dedicated folder
const keyMomentUpload = upload('heading', ['image/*']).single('thumbnail');

router.post('/key-moments', 
  (req, res, next) => {
    console.log('[Key Moment POST] Route hit');
    console.log('[Key Moment POST] Headers:', req.headers);
    next();
  },
  (req, res, next) => {
    // Handle upload with proper error handling for .single()
    keyMomentUpload(req, res, (err) => {
      if (err) {
        console.log('[Key Moment POST] Upload error:', err);
        console.log('[Key Moment POST] Error code:', err.code);
        console.log('[Key Moment POST] Error message:', err.message);
        
        // Multer errors
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large' });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            console.log('[Key Moment POST] Unexpected file field, continuing...');
            return next();
          }
        }
        
        // If it's about missing file, that's OK - controller will handle it
        if (err.message && err.message.includes('No file')) {
          console.log('[Key Moment POST] No file provided, continuing to controller...');
          return next();
        }
        
        // For other errors, return 400
        return res.status(400).json({ error: err.message || 'Upload error' });
      }
      console.log('[Key Moment POST] Upload successful, file:', req.file);
      next();
    });
  },
  upvcController.addKeyMoment
);

router.put('/key-moments/:momentId', 
  (req, res, next) => {
    console.log('[Key Moment PUT] Route hit for momentId:', req.params.momentId);
    next();
  },
  (req, res, next) => {
    keyMomentUpload(req, res, (err) => {
      if (err) {
        console.log('[Key Moment PUT] Upload error:', err.message);
        if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.message.includes('No file')) {
          console.log('[Key Moment PUT] No file provided, continuing...');
          return next();
        }
        return res.status(400).json({ error: err.message });
      }
      console.log('[Key Moment PUT] Upload successful, file:', req.file);
      next();
    });
  },
  upvcController.updateKeyMoment
);

router.delete('/key-moments/:momentId', 
  (req, res, next) => {
    console.log('[Key Moment DELETE] Route hit for momentId:', req.params.momentId);
    next();
  },
  upvcController.deleteKeyMoment
);

module.exports = router;