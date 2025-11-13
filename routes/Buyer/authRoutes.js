const express = require('express');
const { register, login, verifyOTP , buyerInfo , updateUser , getBuyerLeads} = require('../../controllers/Buyer/authController');
const { authenticate } = require('../../middlewares/authMiddleware');
const router = express.Router();
// const { login, verifyOTP } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.get('/', authenticate, buyerInfo);
router.patch('/update', authenticate, updateUser);
router.get('/leads', authenticate, getBuyerLeads);

module.exports = router;
