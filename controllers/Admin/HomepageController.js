const UpvcHomepage = require('../../models/Admin/Homepage');
const fs = require('fs');
const path = require('path');

// Helper to generate file URL
const getFileUrl = (file, req) => {
  if (!file) return null;
  return `${req.protocol}://${req.get('host')}/${file.path.replace(/\\/g, '/')}`;
};

// Helper to normalize file path (extract relative path from uploads directory)
const normalizeFilePath = (filePath) => {
  if (!filePath) return null;
  // Replace backslashes with forward slashes
  let normalized = filePath.replace(/\\/g, '/');
  // Extract path from 'uploads' directory onwards
  const uploadsIndex = normalized.indexOf('uploads/');
  if (uploadsIndex !== -1) {
    normalized = normalized.substring(uploadsIndex);
  } else if (!normalized.startsWith('uploads/')) {
    normalized = 'uploads/' + normalized.replace(/^\//, '');
  }
  // Ensure it starts with uploads/
  if (!normalized.startsWith('uploads/')) {
    normalized = 'uploads/' + normalized;
  }
  return normalized;
};

// ========== CREATE Homepage ==========
exports.createHomepage = async (req, res) => {
  try {
    const { title, subtitle, sponsorText } = req.body;
    console.log("req.body : " , req.body);
    console.log("req.files : " , req.files);
    
    // Access files from req.files when using .fields() middleware
    const videoFile = req.files?.videoUrl?.[0];
    const sponsorLogoFile = req.files?.sponsorLogo?.[0];

    const exists = await UpvcHomepage.findOne();
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Homepage already exists. Use the update endpoint instead.',
      });
    }

    // Validate required fields - model requires title, subtitle, and videoUrl
    if (!videoFile) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required.',
      });
    }

    // Normalize file paths
    const videoPath = normalizeFilePath(videoFile.path);
    const sponsorLogoPath = sponsorLogoFile ? normalizeFilePath(sponsorLogoFile.path) : null;

    const homepageData = {
      title: title || 'Homepage Title',
      subtitle: subtitle || 'Homepage Subtitle',
      updatedAt: Date.now(),
      videoUrl: videoPath,
      sponsorLogo: sponsorLogoPath,
      sponsorText: sponsorText || ''
    };

    const newHomepage = new UpvcHomepage(homepageData);
    await newHomepage.save();

    res.status(201).json({
      success: true,
      message: 'Homepage created successfully',
      data: newHomepage
    });
  } catch (error) {
    console.error('Error in createHomepage:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ========== UPDATE Homepage ==========
exports.updateHomepage = async (req, res) => {
  try {
    const { title, subtitle, sponsorText } = req.body;
    console.log("req.body : " , req.body);
    console.log("req.files : " , req.files);
    
    // Access files from req.files when using .fields() middleware
    const videoFile = req.files?.videoUrl?.[0];
    const sponsorLogoFile = req.files?.sponsorLogo?.[0];

    const existing = await UpvcHomepage.findOne();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Homepage content not found to update',
      });
    }

    const updateData = {
      updatedAt: Date.now()
    };

    // Update text fields if provided
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (sponsorText !== undefined) updateData.sponsorText = sponsorText;

    // Handle video replacement
    if (videoFile) {
      // Delete old video file if it exists
      if (existing.videoUrl) {
        const oldPath = path.join(__dirname, '..', '..', existing.videoUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateData.videoUrl = normalizeFilePath(videoFile.path);
    }

    // Handle sponsor logo replacement
    if (sponsorLogoFile) {
      // Delete old sponsor logo file if it exists
      if (existing.sponsorLogo) {
        const oldPath = path.join(__dirname, '..', '..', existing.sponsorLogo);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateData.sponsorLogo = normalizeFilePath(sponsorLogoFile.path);
    }

    const updated = await UpvcHomepage.findOneAndUpdate({}, { $set: updateData }, { new: true });
    res.status(200).json({
      success: true,
      message: 'Homepage updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error in updateHomepage:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ========== GET Homepage ==========
exports.getContent = async (req, res) => {
  try {
    const content = await UpvcHomepage.findOne();
    // Return 200 with null data instead of 404 - allows frontend to handle empty state gracefully
    res.status(200).json({ 
      success: true, 
      data: content || null,
      message: content ? 'Homepage content retrieved successfully' : 'No homepage content found'
    });
  } catch (error) {
    console.error('Error in getContent:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ========== ADD Key Moment ==========
exports.addKeyMoment = async (req, res) => {
  try {
    const { title, timestamp } = req.body;
    const thumbnailFile = req.file;

    if (!thumbnailFile) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail image is required'
      });
    }

    const newMoment = {
      title,
      timestamp,
      // thumbnail: getFileUrl(thumbnailFile, req)
      thumbnail: thumbnailFile.path
    };

    const updated = await UpvcHomepage.findOneAndUpdate(
      {},
      {
        $push: { keyMoments: newMoment },
        $set: { updatedAt: Date.now() }
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      fs.unlinkSync(thumbnailFile.path);
      return res.status(404).json({
        success: false,
        message: 'No homepage content found to update'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Key moment added successfully',
      data: updated
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Error in addKeyMoment:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ========== UPDATE Key Moment ==========
exports.updateKeyMoment = async (req, res) => {
  try {
    const { momentId } = req.params;
    const { title, timestamp } = req.body;
    const thumbnailFile = req.file;

    const existingContent = await UpvcHomepage.findOne({ 'keyMoments._id': momentId });
    if (!existingContent) {
      if (thumbnailFile) fs.unlinkSync(thumbnailFile.path);
      return res.status(404).json({
        success: false,
        message: 'Key moment not found'
      });
    }

    const existingMoment = existingContent.keyMoments.id(momentId);
    const updateData = {
      'keyMoments.$.title': title,
      'keyMoments.$.timestamp': timestamp,
      updatedAt: Date.now()
    };

    if (thumbnailFile) {
      const oldThumbnailPath = path.join('uploads', existingMoment.thumbnail.split('/').pop());
      if (fs.existsSync(oldThumbnailPath)) fs.unlinkSync(oldThumbnailPath);
      // updateData['keyMoments.$.thumbnail'] = getFileUrl(thumbnailFile.path, req);
      updateData['keyMoments.$.thumbnail'] = thumbnailFile.path
    }

    const updated = await UpvcHomepage.findOneAndUpdate(
      { 'keyMoments._id': momentId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Key moment updated successfully',
      data: updated
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Error in updateKeyMoment:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ========== DELETE Key Moment ==========
exports.deleteKeyMoment = async (req, res) => {
  try {
    const { momentId } = req.params;
    const existingContent = await UpvcHomepage.findOne({ 'keyMoments._id': momentId });

    if (!existingContent) {
      return res.status(404).json({
        success: false,
        message: 'Key moment not found'
      });
    }

    const momentToDelete = existingContent.keyMoments.id(momentId);
    const thumbnailPath = path.join('uploads', momentToDelete.thumbnail.split('/').pop());
    if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);

    const updated = await UpvcHomepage.findOneAndUpdate(
      {},
      {
        $pull: { keyMoments: { _id: momentId } },
        $set: { updatedAt: Date.now() }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Key moment deleted successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error in deleteKeyMoment:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
