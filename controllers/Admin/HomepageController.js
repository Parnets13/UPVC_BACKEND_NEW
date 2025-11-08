const UpvcHomepage = require('../../models/Admin/Homepage');
const fs = require('fs');
const path = require('path');

// Helper to generate file URL
const getFileUrl = (file, req) => {
  if (!file) return null;
  return `${req.protocol}://${req.get('host')}/${file.path.replace(/\\/g, '/')}`;
};

// ========== CREATE Homepage ==========
exports.createHomepage = async (req, res) => {
  try {
    const { title, subtitle } = req.body;
    console.log("req.body : " , req.body)
    const videoFile = req.file || req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    const exists = await UpvcHomepage.findOne();
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Homepage already exists. Use the update endpoint instead.',
      });
    }

    const homepageData = {
      title,
      subtitle,
      updatedAt: Date.now(),
      videoUrl: videoFile.path ,
      sponsorLogo: req.files?.sponsorLogo?.[0]?.path,
      sponsorText: req.body.sponsorText
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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ========== UPDATE Homepage ==========
exports.updateHomepage = async (req, res) => {
  try {
    const { title, subtitle , sponsorText} = req.body;
    const videoFile = req.file || req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    const existing = await UpvcHomepage.findOne();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Homepage content not found to update',
      });
    }

    const updateData = {
      title,
      subtitle,
      sponsorText,
      updatedAt: Date.now()
    };

    // Handle video replacement
    if (videoFile) {
      if (existing.videoUrl) {
        const oldPath = path.join('uploads', existing.videoUrl.split('/').pop());
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.videoUrl = videoFile.path
    }

    // Handle sponsor logo replacement
    if (req.files?.sponsorLogo?.[0]) {
      if (existing.sponsorLogo) {
        const oldPath = path.join('uploads', existing.sponsorLogo.split('/').pop());
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.sponsorLogo = req.files.sponsorLogo[0].path;
    }

    const updated = await UpvcHomepage.findOneAndUpdate({}, { $set: updateData }, { new: true });
    res.status(200).json({
      success: true,
      message: 'Homepage updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error in updateHomepage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ========== GET Homepage ==========
exports.getContent = async (req, res) => {
  try {
    const content = await UpvcHomepage.findOne();
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'No homepage content found'
      });
    }
    res.status(200).json({ success: true, data: content });
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
