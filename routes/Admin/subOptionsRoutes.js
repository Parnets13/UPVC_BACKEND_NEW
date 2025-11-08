const express = require('express');
const windowOptionsController = require('../../controllers/Admin/windowSubOption');
const authenticateAdmin = require('./../../middlewares/adminAuth');
const upload = require('../../middlewares/upload');
const multer = require('multer');

const router = express.Router();

// Error handler for multer upload errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ message: err.message });
  }
  next();
};

router.get('/', windowOptionsController.getAllOptions);
router.use(authenticateAdmin);
// Admin protected routes
// Use multer for video uploads - single file with field name 'video'
// Note: video is optional, so we don't require it
router.post('/', upload('sub-options/videos').single('video'), handleUploadErrors, windowOptionsController.createOption);
router.patch('/:id', upload('sub-options/videos').single('video'), handleUploadErrors, windowOptionsController.updateOption);
router.delete('/:id', windowOptionsController.deleteOption);
router.get('/predefined', windowOptionsController.getPredefinedOptions);

module.exports = router;
