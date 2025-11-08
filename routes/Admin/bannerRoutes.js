const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../../middlewares/upload');
const bannerController = require('../../controllers/Admin/bannerController');

const bannerUpload = upload('banners', ['video/*', 'image/jpeg', 'image/png']);

const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};
// In your routes file (bannerRoutes.js)
router.post(
  '/',
  bannerUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'chapterThumbnail0', maxCount: 1 },
    { name: 'chapterThumbnail1', maxCount: 1 },
    { name: 'chapterThumbnail2', maxCount: 1 },
    { name: 'chapterThumbnail3', maxCount: 1 }
  ]),
  handleUploadErrors,
  bannerController.createBanner
);

router.put(
  '/:id',
  bannerUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'chapterThumbnail0', maxCount: 1 },
    { name: 'chapterThumbnail1', maxCount: 1 },
    { name: 'chapterThumbnail2', maxCount: 1 },
    { name: 'chapterThumbnail3', maxCount: 1 }
  ]),
  bannerController.updateBanner
);

router.get('/', bannerController.getAllBanners);
router.get('/:id', bannerController.getBannerById);
router.delete('/:id', bannerController.deleteBanner);

module.exports = router;