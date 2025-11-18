const UpvcHomepage = require('../../models/Admin/Homepage');
const fs = require('fs');
const path = require('path');
const { transcodeVideoIfNeeded } = require('../../utils/videoTranscoder');

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

    // Transcode video to mobile-compatible format
    const originalVideoPath = videoFile.path;
    const transcodedVideoPath = originalVideoPath.replace(/\.(mp4|webm|ogg)$/i, '_mobile.mp4');
    
    console.log('[createHomepage] Transcoding video for mobile compatibility...');
    const transcodeResult = await transcodeVideoIfNeeded(originalVideoPath, transcodedVideoPath);
    
    let finalVideoPath;
    if (transcodeResult.success && transcodeResult.transcoded) {
      // Use transcoded video
      finalVideoPath = normalizeFilePath(transcodeResult.outputPath);
      // Delete original video to save space
      if (fs.existsSync(originalVideoPath)) {
        try {
          fs.unlinkSync(originalVideoPath);
          console.log('[createHomepage] Original video deleted after transcoding');
        } catch (err) {
          console.warn('[createHomepage] Could not delete original video:', err.message);
        }
      }
    } else {
      // Use original video if transcoding failed or not needed
      finalVideoPath = normalizeFilePath(originalVideoPath);
      if (transcodeResult.error) {
        console.warn('[createHomepage] Transcoding failed, using original video:', transcodeResult.error);
      }
    }

    const sponsorLogoPath = sponsorLogoFile ? normalizeFilePath(sponsorLogoFile.path) : null;

    const homepageData = {
      title: title || 'Homepage Title',
      subtitle: subtitle || 'Homepage Subtitle',
      updatedAt: Date.now(),
      videoUrl: finalVideoPath,
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
        // Also delete old mobile version if it exists
        const oldMobilePath = oldPath.replace(/\.(mp4|webm|ogg)$/i, '_mobile.mp4');
        if (fs.existsSync(oldMobilePath)) {
          try {
            fs.unlinkSync(oldMobilePath);
          } catch (err) {
            // Ignore errors
          }
        }
      }

      // Transcode video to mobile-compatible format
      const originalVideoPath = videoFile.path;
      const transcodedVideoPath = originalVideoPath.replace(/\.(mp4|webm|ogg)$/i, '_mobile.mp4');
      
      console.log('[updateHomepage] Transcoding video for mobile compatibility...');
      const transcodeResult = await transcodeVideoIfNeeded(originalVideoPath, transcodedVideoPath);
      
      let finalVideoPath;
      if (transcodeResult.success && transcodeResult.transcoded) {
        // Use transcoded video
        finalVideoPath = normalizeFilePath(transcodeResult.outputPath);
        // Delete original video to save space
        if (fs.existsSync(originalVideoPath)) {
          try {
            fs.unlinkSync(originalVideoPath);
            console.log('[updateHomepage] Original video deleted after transcoding');
          } catch (err) {
            console.warn('[updateHomepage] Could not delete original video:', err.message);
          }
        }
      } else {
        // Use original video if transcoding failed or not needed
        finalVideoPath = normalizeFilePath(originalVideoPath);
        if (transcodeResult.error) {
          console.warn('[updateHomepage] Transcoding failed, using original video:', transcodeResult.error);
        }
      }

      updateData.videoUrl = finalVideoPath;
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
  console.log('[addKeyMoment] Controller called');
  console.log('[addKeyMoment] req.body:', req.body);
  console.log('[addKeyMoment] req.file:', req.file);
  try {
    const { title, timestamp } = req.body;
    const thumbnailFile = req.file;

    if (!thumbnailFile) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail image is required'
      });
    }

    // Normalize thumbnail path
    const thumbnailPath = normalizeFilePath(thumbnailFile.path);
    
    const newMoment = {
      title,
      timestamp,
      thumbnail: thumbnailPath
    };

    console.log('[addKeyMoment] New moment data:', newMoment);

    // Try to update existing homepage, or create one if it doesn't exist
    let updated = await UpvcHomepage.findOneAndUpdate(
      {},
      {
        $push: { keyMoments: newMoment },
        $set: { updatedAt: Date.now() }
      },
      { new: true, runValidators: true }
    );

    // If no homepage exists, create one with the key moment
    if (!updated) {
      console.log('[addKeyMoment] No homepage found, creating new one with key moment');
      
      // Create a placeholder video file path that's valid
      const placeholderVideoPath = 'uploads/advertisements/placeholder.mp4';
      
      // Ensure the directory exists
      const placeholderDir = path.join(__dirname, '..', '..', 'uploads', 'advertisements');
      if (!fs.existsSync(placeholderDir)) {
        fs.mkdirSync(placeholderDir, { recursive: true });
      }
      
      // Create an empty placeholder file if it doesn't exist
      const placeholderFullPath = path.join(__dirname, '..', '..', placeholderVideoPath);
      if (!fs.existsSync(placeholderFullPath)) {
        fs.writeFileSync(placeholderFullPath, '');
      }
      
      const newHomepage = new UpvcHomepage({
        title: 'Homepage Title',
        subtitle: 'Homepage Subtitle',
        videoUrl: placeholderVideoPath, // Valid path that exists
        keyMoments: [newMoment],
        updatedAt: Date.now()
      });
      
      try {
        updated = await newHomepage.save();
        console.log('[addKeyMoment] New homepage created successfully');
      } catch (saveError) {
        console.error('[addKeyMoment] Error saving new homepage:', saveError);
        console.error('[addKeyMoment] Validation errors:', saveError.errors);
        // Clean up uploaded file if save fails
        if (thumbnailFile && thumbnailFile.path) {
          try {
            fs.unlinkSync(thumbnailFile.path);
          } catch (unlinkError) {
            console.error('[addKeyMoment] Error deleting file:', unlinkError);
          }
        }
        throw saveError; // Re-throw to be caught by outer catch
      }
    }

    res.status(200).json({
      success: true,
      message: 'Key moment added successfully',
      data: updated
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('[addKeyMoment] Cleaned up uploaded file due to error');
      } catch (unlinkError) {
        console.error('[addKeyMoment] Error deleting file:', unlinkError);
      }
    }
    console.error('Error in addKeyMoment:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      errors: error.errors
    });
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
      // Delete old thumbnail if it exists
      if (existingMoment.thumbnail) {
        const oldThumbnailFullPath = path.join(__dirname, '..', '..', existingMoment.thumbnail);
        if (fs.existsSync(oldThumbnailFullPath)) {
          try {
            fs.unlinkSync(oldThumbnailFullPath);
          } catch (unlinkError) {
            console.error('[updateKeyMoment] Error deleting old thumbnail:', unlinkError);
          }
        }
      }
      // Normalize and set new thumbnail path
      updateData['keyMoments.$.thumbnail'] = normalizeFilePath(thumbnailFile.path);
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
