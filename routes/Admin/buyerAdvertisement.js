const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const advertisementController = require('../../controllers/Admin/buyerAdvertisementController');

// Create multer instance specifically for advertisements that accepts any field
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join('uploads', 'advertisements');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Get all advertisements
router.get('/', advertisementController.getAllAdvertisements);

// Get advertisements by type (featured/latest/trending)
router.get('/:type', advertisementController.getAdvertisementsByType);

// Create new advertisement
router.post('/', upload.any(), advertisementController.createAdvertisement);

// Update advertisement
router.put('/:id', upload.any(), advertisementController.updateAdvertisement);

// Delete advertisement
router.delete('/:id', advertisementController.deleteAdvertisement);

// Toggle like on advertisement
router.post('/:id/like', advertisementController.toggleLike);

// Check file integrity
router.get('/:id/check-integrity', advertisementController.checkFileIntegrity);

module.exports = router;