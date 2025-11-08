const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const otpController = require("../../controllers/Seller/otpController");
const sellerController = require("../../controllers/Seller/sellerController");
const { authenticateSeller } = require("../../middlewares/sellerAuth");

// OTP routes
router.post("/send-otp", otpController.sendOtp);
router.post("/verify-otp", otpController.verifyOtp);

// Seller routes
router.post(
  "/register",
  upload("sellers").fields([
    { name: "gstCertificate", maxCount: 1 },
    { name: "visitingCard", maxCount: 1 },
    { name: "businessProfileVideo", maxCount: 1 },
  ]),
  sellerController.registerSeller
);

router.get("/", authenticateSeller , sellerController.getSellerProfile);
router.put(
  "/",
  upload("sellers").fields([
    { name: "gstCertificate", maxCount: 1 },
    { name: "visitingCard", maxCount: 1 },
    { name: "businessProfileVideo", maxCount: 1 },
  ]),
  authenticateSeller,
  sellerController.updateSellerProfile
);

router.get('/getAllSeller' ,sellerController.getAllSellers)

// New explicit video upload
router.post(
  "/business-video",
  upload.video("businessProfileVideo"),
  authenticateSeller,
  sellerController.handleBusinessVideo
);

// Alternative using the folder approach (also works)
// router.put('/:sellerId/business-video',
//   upload('sellers/videos').single('businessVideo'),
//   sellerController.handleBusinessVideo
// );

module.exports = router;
