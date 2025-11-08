const express = require('express');
const router = express.Router();
const upvcController = require('../../controllers/Admin/HomepageController');
const upload = require('../../middlewares/upload');

// Main content routes
router.get("/", upvcController.getContent);
// For creating homepage
router.post(
  "/",
    upload('advertisements').fields([
      { name: 'videoUrl', maxCount: 1 },
      { name: 'sponsorLogo', maxCount: 1 }
    ]), 
  upvcController.createHomepage
);

// Update homepage - handles video and optional sponsor logo
router.put(
  "/",
    upload('advertisements').fields([
      { name: 'videoUrl', maxCount: 1 },
      { name: 'sponsorLogo', maxCount: 1 }
    ]),
  upvcController.updateHomepage
);
 
// Key moments
router.post('/key-moments', upload('thumbnail', ['image/*']).single('thumbnail'), upvcController.addKeyMoment);
router.put('/key-moments/:momentId', upload('thumbnail', ['image/*']).single('thumbnail'), upvcController.updateKeyMoment);
router.delete('/key-moments/:momentId', upvcController.deleteKeyMoment);

module.exports = router;