const Seller = require('../../models/Seller/Seller');
const Otp = require('../../models/Seller/Otp');
const crypto = require('crypto');
const { signOTPToken } = require('../../utils/jwtHelper');

// Generate OTP
const generateOtp = () => {
  return crypto.randomInt(1000, 9999).toString();
};

// Send OTP
exports.sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Generate OTP
    const otp = generateOtp();

    // Save OTP to database
    await Otp.create({ phoneNumber, otp });

    res.status(200).json({ 
      success: true, 
      message: 'OTP generated successfully',
      otp 
    });
  } catch (error) {
    console.error('Error in sendOtp:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and OTP are required' 
      });
    }

    // Find the most recent OTP for the phone number
    const otpRecord = await Otp.findOne({ 
      phoneNumber, 
      otp 
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP or OTP expired' 
      });
    }

    // Check if seller exists
    const seller = await Seller.findOne({ phoneNumber });
    console.log("seller" , seller)
    if (seller) {
      const token = signOTPToken({ 
        phoneNumber, 
        sellerId: seller._id,
      })
      // Existing seller - mark as verified
      seller.isVerified = true;
      await seller.save();
      
      return res.status(200).json({ 
        success: true, 
        message: 'OTP verified successfully',
        isNewUser: false,
        seller,
        status: seller.status, // Include seller status
        token
      });
    } else {
      // New seller
      return res.status(200).json({ 
        success: true, 
        message: 'OTP verified successfully. Please complete registration.',
        isNewUser: true , 
      });
    }
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};