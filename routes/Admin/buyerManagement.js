const express = require('express');
const router = express.Router();
const buyerController = require('../../controllers/Admin/buyerController');

// Buyer management routes
router.get('/buyers', buyerController.getAllBuyers);
router.get('/buyers/:buyerId', buyerController.getBuyerById);
router.put('/buyers/:buyerId', buyerController.updateBuyer);
router.delete('/buyers/:buyerId', buyerController.deleteBuyer);

module.exports = router;















