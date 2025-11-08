const Seller = require('../../models/Seller/Seller');
const path = require('path');
const fs = require('fs');
const { signOTPToken } = require('../../utils/jwtHelper');

// Register new seller
exports.registerSeller = async (req, res) => {
  try {
    const { 
      phoneNumber,
      companyName,
      address,
      city,
      yearsInBusiness,
      pinCode,
      email,
      website,
      gstNumber,
      contactPerson,
      contactNumber,
      brandOfProfileUsed
    } = req.body;

    // Check if seller already exists
    const existingSeller = await Seller.findOne({ phoneNumber });
    if (existingSeller && existingSeller.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Seller already registered' 
      });
    }

    // Process uploaded files
    const gstCertificatePath = req.files['gstCertificate'] 
      ? path.join('sellers', req.files['gstCertificate'][0].filename) 
      : null;
    const visitingCardPath = req.files['visitingCard'] 
      ? path.join('sellers', req.files['visitingCard'][0].filename) 
      : null;
    const businessProfileVideoPath = req.files['businessProfileVideo'] 
      ? path.join('sellers', req.files['businessProfileVideo'][0].filename) 
      : null;

    // Create or update seller
    const sellerData = {
      phoneNumber,
      isVerified: true,
      status: 'pending',
      isActive: false, 
      companyName,
      address,
      city,
      yearsInBusiness,
      pinCode,
      email,
      website,
      gstNumber,
      contactPerson,
      contactNumber,
      brandOfProfileUsed,
      gstCertificate: gstCertificatePath,
      visitingCard: visitingCardPath,
      businessProfileVideo: businessProfileVideoPath
    };

    let seller;
    if (existingSeller) {
      // Update existing seller
      seller = await Seller.findByIdAndUpdate(existingSeller._id, sellerData, { new: true });
    } else {
      // Create new seller
      seller = await Seller.create(sellerData);
    }
      const token = signOTPToken({ 
        phoneNumber, 
        sellerId: seller._id,
      })
    res.status(201).json({ 
      success: true, 
      message: 'Seller registered successfully',
      seller ,
      token
    });
  } catch (error) {
    console.error('Error in registerSeller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get seller profile
exports.getSellerProfile = async (req, res) => {
  try { 

    const seller = await Seller.findOne({ _id : req.seller._id }).populate({
      path: 'leads',
      populate: {
        path: 'quotes.product category',
      },
    });
    if (!seller) {
      return res.status(404).json({ 
        success: false, 
        message: 'Seller not found' 
      });
    }

    // Check if seller is approved
    // if (seller.status !== 'approved') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Seller account not approved yet',
    //     status: seller.status,
    //     rejectionReason: seller.rejectionReason
    //   });
    // }

    res.status(200).json({ 
      success: true, 
      seller 
    });
  } catch (error) {
    console.error('Error in getSellerProfile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Update seller profile
exports.updateSellerProfile = async (req, res) => {
  try {
    // const { phoneNumber } = req.params;
    const _id = req.seller._id;
    const updateData = req.body;
  
    const existingSeller = await Seller.findOne({ _id });
    if (!existingSeller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    if (existingSeller.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Only approved sellers can update profiles',
        status: existingSeller.status
      });
    }

    // Process uploaded files
    if (req.files) {
      if (req.files['gstCertificate']) {
        updateData.gstCertificate = path.join('sellers', req.files['gstCertificate'][0].filename);
      }
      if (req.files['visitingCard']) {
        updateData.visitingCard = path.join('sellers', req.files['visitingCard'][0].filename);
      }
      if (req.files['businessProfileVideo']) {
        updateData.businessProfileVideo = path.join('sellers', req.files['businessProfileVideo'][0].filename);
      }
    }

    const seller = await Seller.findOneAndUpdate(
      { _id },
      updateData,
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({ 
        success: false, 
        message: 'Seller not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Seller profile updated successfully',
      seller 
    });
  } catch (error) {
    console.error('Error in updateSellerProfile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Add or Update Business Profile Video
// exports.handleBusinessVideo = async (req, res) => {
//   try {
//     const { sellerId } = req.params;
    
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'No video file uploaded'
//       });
//     }

//     // Validate seller exists
//     const seller = await Seller.findById(sellerId);
//     if (!seller) {
//       return res.status(404).json({
//         success: false,
//         message: 'Seller not found'
//       });
//     }

//     // Delete old video if exists
//     if (seller.businessProfileVideo) {
//       const oldVideoPath = path.join(__dirname, '../../public', seller.businessProfileVideo);
//       if (fs.existsSync(oldVideoPath)) {
//         fs.unlinkSync(oldVideoPath);
//       }
//     }

//     // Save new video
//     const videoPath = `/uploads/sellers/videos/${sellerId}-${Date.now()}${path.extname(req.file.originalname)}`;
//     const uploadDir = path.join(__dirname, '../../public/uploads/sellers/videos');
    
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }

//     fs.writeFileSync(path.join(__dirname, '../../public', videoPath), req.file.buffer);

//     // Update seller record
//     seller.businessProfileVideo = videoPath;
//     await seller.save();

//     res.status(200).json({
//       success: true,
//       message: 'Business profile video updated successfully',
//       videoUrl: videoPath
//     });
//   } catch (error) {
//     console.error('Error handling business video:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: error.message
//     });
//   }
// }; 

exports.handleBusinessVideo = async (req, res) => {
  try {
    // console.log("req.seller._id : " , req.seller._id)
    const sellerId = req.seller._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    const seller = await Seller.findById(sellerId);
    console.log("seller : " , seller)
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Delete old video if it exists
    if (seller.businessProfileVideo) {
      const oldVideoPath = path.join(__dirname, '../../public', seller.businessProfileVideo);
      if (fs.existsSync(oldVideoPath)) {
        fs.unlinkSync(oldVideoPath);
      }
    }

    // Save the multer-uploaded video path
    const relativeVideoPath = `/uploads/sellers/videos/${req.file.filename}`;
    seller.businessProfileVideo = relativeVideoPath;
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Business profile video updated successfully',
      videoUrl: relativeVideoPath
    });

  } catch (error) {
    console.error('Error handling business video:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Delete Business Profile Video
exports.deleteBusinessVideo = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    if (!seller.businessProfileVideo) {
      return res.status(400).json({
        success: false,
        message: 'No business video exists to delete'
      });
    }

    // Delete video file
    const videoPath = path.join(__dirname, '../../public', seller.businessProfileVideo);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    // Update seller record
    seller.businessProfileVideo = undefined;
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Business profile video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting business video:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Approve seller
exports.approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      { status: 'approved', isActive: true },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seller approved successfully',
      seller
    });
  } catch (error) {
    console.error('Error approving seller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reject seller
exports.rejectSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      { status: 'rejected', rejectionReason: reason, isActive: false },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seller rejected successfully',
      seller
    });
  } catch (error) {
    console.error('Error rejecting seller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Block/Unblock seller
exports.toggleSellerStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const newStatus = !seller.isActive;
    const statusText = newStatus ? 'unblocked' : 'blocked';

    seller.isActive = newStatus;
    seller.status = newStatus ? 'approved' : 'blocked';
    await seller.save();

    res.status(200).json({
      success: true,
      message: `Seller ${statusText} successfully`,
      seller
    });
  } catch (error) {
    console.error('Error toggling seller status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all sellers with filters
exports.getAllSellers = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    }

    // Add search filter
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    const [total, sellers] = await Promise.all([
      Seller.countDocuments(filter),
      Seller.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      count: sellers.length,
      sellers
    });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get seller by ID (for admin)
exports.getSellerById = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findById(sellerId);
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      seller
    });
  } catch (error) {
    console.error('Error fetching seller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update seller by admin
exports.updateSellerByAdmin = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const updateData = req.body;

    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seller updated successfully',
      seller
    });
  } catch (error) {
    console.error('Error updating seller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete seller
exports.deleteSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await Seller.findByIdAndDelete(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seller deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting seller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};