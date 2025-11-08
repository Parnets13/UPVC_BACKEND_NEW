const express = require('express');
const router = express.Router();
const leadController = require('../../controllers/Admin/lead');
const { authenticate } = require('../../middlewares/authMiddleware');
const { authenticateSeller } = require('../../middlewares/sellerAuth');
const Seller = require('../../models/Seller/Seller');

// Get seller's remaining quota
router.get('/quota', authenticateSeller, leadController.getSellerQuota);
// Lead management routes
router.post('/',authenticate, leadController.createLead);
router.get('/', leadController.getAllLeads);
router.get('/:id', leadController.getLeadById);
router.post('/purchase', authenticateSeller, leadController.purchaseLead);
router.put('/status', leadController.updateLeadStatus);
router.post('/calculate-price', leadController.calculateLeadPrice);


// Check if quota was used for a lead
router.get('/lead-quota-check/:leadId', authenticateSeller, async (req, res) => {
  try {
    const seller = await Seller.findById({_id : req.seller._id});
    const alreadyUsed = seller.quotaUsage.some(u => u.leadId.equals(req.params.leadId));
    res.json({ success: true, alreadyUsed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;