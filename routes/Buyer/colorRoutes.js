const express = require('express');
const router = express.Router();
const upload = require('../../middlewares/upload');
//const colorVideoController = require('../../controllers/Buyer/colorVideoController');
const colorComparisonController = require('../../controllers/Buyer/colorComparisonController');
//const authenticateAdmin = require('./../../middlewares/adminAuth');

const {
  createColorVideo,
  getAllColorVideos,
  updateColorVideo,
  deleteColorVideo,
  getColorVideoById
} = require('../../controllers/Buyer/colorVideoController');
// Public routes
//router.get('/videos', colorVideoController.getVideos);


// Protected admin routes
router.post(
  '/video',
  // upload('color', ['video/mp4', 'video/webm']).single('video'),
   upload('color').fields([
          { name: 'color', maxCount: 1 },
          { name: 'sponsorLogo', maxCount: 1 }
        ]),

  createColorVideo
);
router.get('/video/:id', getColorVideoById);
router.delete('/video/:id', deleteColorVideo);
router.put('/video/:id', 
  // upload('color', ['video/mp4', 'video/webm']).single('video'),
     upload('color').fields([
          { name: 'color', maxCount: 1 },
          { name: 'sponsorLogo', maxCount: 1 }
        ]),
 updateColorVideo);
router.get('/video', getAllColorVideos);
//comparisons
router.post('/comparisons', colorComparisonController.createComparison);
router.get('/comparisons', colorComparisonController.getComparisons);
router.get('/comparisons/:id', colorComparisonController.getComparisonById);
router.put('/comparisons/:id', colorComparisonController.updateComparison);
router.delete('/comparisons/:id', colorComparisonController.deleteComparison);



module.exports = router;