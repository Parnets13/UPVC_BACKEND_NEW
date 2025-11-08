const express = require('express');
const router = express.Router();
const feedbackController = require('../../controllers/Buyer/feedbackController');


// Public routes

router.post('/', feedbackController.createFeedback);
router.get('/', feedbackController.getAllFeedback);



router.get('/:id', feedbackController.getFeedback);
router.put('/:id', feedbackController.updateFeedback);
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;