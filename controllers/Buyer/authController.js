const Lead = require('../../models/Admin/lead');
const User = require('../../models/Buyer/User');
const generateOTP = require('../../utils/generateOTP');
const { signOTPToken } = require('../../utils/jwtHelper');

exports.login = async (req, res) => {
  try {
    console.log("=== LOGIN REQUEST RECEIVED ===");
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);
    
    const { mobileNumber } = req.body;
    console.log("Mobile number received:", mobileNumber);
    
    if (!mobileNumber || mobileNumber.length !== 10) {
      console.log("Invalid mobile number:", mobileNumber);
      return res.status(400).json({ message: 'Invalid mobile number' });
    }

    console.log("Generating OTP...");
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 min
    console.log("OTP generated:", otp);

    console.log("Updating/creating user in database...");
    const user = await User.findOneAndUpdate(
      { mobileNumber },
      { otp, otpExpires },
      { new: true, upsert: true }
    );
    console.log("User found/created:", user._id);

    console.log("Generating JWT token...");
    const token = signOTPToken({ mobileNumber, userId: user._id });
    console.log("Token generated successfully");

    console.log("=== SENDING SUCCESS RESPONSE ===");
    return res.status(200).json({
      message: 'OTP sent',
      otp,
      token
    });
  } catch (error) {
    console.log("=== LOGIN ERROR ===");
    console.log("Error message:", error.message);
    console.log("Error stack:", error.stack);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
  
exports.verifyOTP = async (req, res) => {
  const { mobileNumber, otp } = req.body;
  const user = await User.findOne({ mobileNumber });
  
  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    return res.status(401).json({ message: 'Invalid or expired OTP' });
  }
  
  // Clear OTP
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();
  
  // Include user._id in the token payload
  const token = signOTPToken({ 
    mobileNumber, 
    userId: user._id
  });
  return res.status(200).json({ 
    message: 'OTP verified. Login successful', 
    token,
    user: {
      name: user.name || '',
      mobileNumber: user.mobileNumber,
      id: user._id,
    } 
  });
};

exports.buyerInfo = async (req , res) => { 
  try{
    const user = await User.findOne({_id : req.user._id})
    if (!user){
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({
      message: 'User data fetched successful',
      user
    });
  } catch(err){
    console.error("Error fetching Buyer : " , err)
  }
}

exports.updateUser = async (req, res) => {
  try {
    const id = req.user._id;
    const updates = req.body;

    if (updates.mobileNumber) {
      const existingUser = await User.findOne({ mobileNumber: updates.mobileNumber });
      if (existingUser && existingUser._id.toString() !== id.toString()) {
        return res.status(400).json({ error: 'Mobile number already in use' });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      details: error.errors || null
    });
  }
};

exports.getBuyerLeads = async (req, res) => {
  try {
    const buyerId = req.user._id;
    console.log("Confirmed")

    const toAbsoluteUrl = (url, { ensureLeadingSlash = true } = {}) => {
      if (!url) return null;
      if (typeof url !== 'string') url = String(url);

      const ensureSlash = (value) => {
        if (!value) return ensureLeadingSlash ? '/' : '';
        return ensureLeadingSlash
          ? value.startsWith('/') ? value : `/${value}`
          : value.replace(/^\/+/, '');
      };

      try {
        const parsed = new URL(url);
        const pathname = ensureSlash(parsed.pathname || '/');
        const search = parsed.search || '';
        const hash = parsed.hash || '';
        return `${req.protocol}://${req.get('host')}${pathname}${search}${hash}`;
      } catch (err) {
        // Not an absolute URL, treat as relative
        const normalized = ensureSlash(url);
        return `${req.protocol}://${req.get('host')}${normalized}`;
      }
    };

    const leads = await Lead.find({ buyer: buyerId })
      .populate({
        path: 'category',
        select: 'name description videoUrl'
      })
      .populate({
        path: 'seller.sellerId',
        select: 'companyName brandOfProfileUsed contactPerson phoneNumber businessProfileVideo visitingCard yearsInBusiness'
      })
      .populate({
        path: 'quotes.product',
        select: 'title features videoUrl'
      })
      .sort({ createdAt: -1 });

    // Format the response to match frontend structure
    const formattedLeads = leads.map(lead => {
      const sellers = lead.seller.map(seller => {
        const sellerData = seller.sellerId || {};
        return {
          id: seller._id,
          brandName: sellerData.brandOfProfileUsed || 'Unknown Brand',
          video: toAbsoluteUrl(sellerData.businessProfileVideo),
          name: sellerData.contactPerson || 'Unknown',
          contactNo: sellerData.phoneNumber || 'N/A',
          whatsapp: sellerData.phoneNumber || 'N/A',
          address: sellerData.address || 'Address not available',
          yearsInBusiness: sellerData.yearsInBusiness?.toString() || 'N/A',
          manuCap: '5000 units/month', // Default value
          teamSize: '100', // Default value
          visitingCard: toAbsoluteUrl(sellerData.visitingCard),
          quotes: lead.quotes.map(quote => ({
            productType: quote.productType,
            productTitle: quote.product?.title || 'Unknown Product',
            color: quote.color,
            size: `${quote.height}ft x ${quote.width}ft`,
            quantity: quote.quantity,
            features: quote.product?.features || []
          }))
        };
      });

      return {
        id: lead._id,
        date: new Date(lead.createdAt).toLocaleDateString(),
        projectAddress: lead.projectInfo.address,
        projectName: lead.projectInfo.name,
        projectStage: lead.projectInfo.stage,
        projectTimeline: lead.projectInfo.timeline,
        category: lead.category?.name || 'Standard',
        quotes: lead.quotes.map(quote => ({
            productType: quote.productType,
            productTitle: quote.product?.title || 'Unknown Product',
            color: quote.color,
            size: `${quote.height}ft x ${quote.width}ft`,
            quantity: quote.quantity,
            features: quote.product?.features || []
          })),
        categoryVideo: toAbsoluteUrl(lead.category?.videoUrl),
        sellers,
        contactInfo: {
          name: lead.contactInfo.name,
          phone: lead.contactInfo.contactNumber,
          whatsapp: lead.contactInfo.whatsappNumber,
          email: lead.contactInfo.email
        }
      };
    });

    res.status(200).json({ 
      success: true, 
      count: formattedLeads.length,
      leads: formattedLeads 
    });
  } catch (error) {
    console.error('Error fetching buyer leads:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch leads',
      error: error.message 
    });
  }
};