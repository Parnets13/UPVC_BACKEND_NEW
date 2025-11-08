const express = require('express');
const router = express.Router();
const quoteController = require('../../controllers/Buyer/quoteController');
const { authenticate } = require('../../middlewares/authMiddleware');

// Quote CRUD operations
router.post('/', authenticate, quoteController.createQuote);
router.get('/buyer', authenticate, quoteController.getBuyerQuotes);
router.put('/:quoteId', quoteController.updateQuote);
router.delete('/:quoteId', quoteController.deleteQuote);

// Convert quotes to lead
router.post('/convert-to-lead', quoteController.convertToLead);



// Cart/Quote Routes
// router.post('/', authenticate, quoteController.addToCart);
// router.get('/buyer', authenticate, quoteController.getCart);
// router.put('/:quoteId', quoteController.updateCartItem);
// router.delete('/:quoteId',  quoteController.removeFromCart);
// // router.delete('/cart', buyerAuth, quoteController.clearCart);
// router.post('/cart/convert-to-lead',  quoteController.convertCartToLead);


module.exports = router;