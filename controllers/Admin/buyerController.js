const User = require('../../models/Buyer/User');

// Get all buyers with pagination and search
exports.getAllBuyers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const filter = {};
    
    // Add search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    const [total, buyers] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: pageSize,
      count: buyers.length,
      buyers
    });
  } catch (error) {
    console.error('Error fetching buyers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get buyer by ID
exports.getBuyerById = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const buyer = await User.findById(buyerId);
    
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.status(200).json({
      success: true,
      buyer
    });
  } catch (error) {
    console.error('Error fetching buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update buyer by admin
exports.updateBuyer = async (req, res) => {
  try {
    const { buyerId } = req.params;
    const updateData = req.body;

    // Check if mobile number is being updated and if it's already in use
    if (updateData.mobileNumber) {
      const existingUser = await User.findOne({ mobileNumber: updateData.mobileNumber });
      if (existingUser && existingUser._id.toString() !== buyerId) {
        return res.status(400).json({
          success: false,
          error: 'Mobile number already in use'
        });
      }
    }

    const buyer = await User.findByIdAndUpdate(
      buyerId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Buyer updated successfully',
      buyer
    });
  } catch (error) {
    console.error('Error updating buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete buyer
exports.deleteBuyer = async (req, res) => {
  try {
    const { buyerId } = req.params;

    const buyer = await User.findByIdAndDelete(buyerId);

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Buyer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};




