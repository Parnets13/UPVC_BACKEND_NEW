const Advertisement = require('../../models/Admin/buyerAdvertisement');
const fs = require('fs');
const path = require('path');
const { 
  safeDeleteFile, 
  fileExists, 
  normalizePath, 
  validateFileType, 
  verifyUploadedFile,
  safeDeleteMultipleFiles 
} = require('../../utils/fileHelper');

// Get all advertisements
exports.getAllAdvertisements = async (req, res) => {
  try {
    const ads = await Advertisement.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, ads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get advertisements by type
exports.getAdvertisementsByType = async (req, res) => {
  try {
    const { type } = req.params;
    let query = {};
    
    if (type === 'featured') {
      query.isFeatured = true;
    } else if (type === 'trending') {
      query.likes = { $gte: 100 }; // Example threshold for trending
    }
    
    const ads = await Advertisement.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, ads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new advertisement
exports.createAdvertisement = async (req, res) => {
  const uploadedFiles = [];
  
  try {
    const { title, description, type, category, sponsorText } = req.body;
    const files = req.files || [];
    
    console.log('[CreateAd] Starting advertisement creation:', { title, type, category });
    
    // Organize files by field name
    const filesByField = Array.isArray(files)
      ? files.reduce((acc, f) => {
          acc[f.fieldname] = acc[f.fieldname] || [];
          acc[f.fieldname].push(f);
          return acc;
        }, {})
      : files;

    // Extract media file
    const mediaFile = (filesByField['media'] && filesByField['media'][0]) || (Array.isArray(files) && files[0]);
    
    if (!mediaFile) {
      return res.status(400).json({ 
        success: false, 
        message: 'Media file is required',
        code: 'MEDIA_FILE_REQUIRED'
      });
    }

    // Validate media file type
    const mediaValidation = validateFileType(mediaFile, type || 'image');
    if (!mediaValidation.valid) {
      // Delete uploaded file
      safeDeleteFile(path.join('uploads', 'advertisements', mediaFile.filename));
      return res.status(400).json({ 
        success: false, 
        message: mediaValidation.error,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Verify media file exists on disk
    if (!verifyUploadedFile(mediaFile)) {
      return res.status(500).json({ 
        success: false, 
        message: 'Media file upload failed',
        code: 'FILE_UPLOAD_FAILED'
      });
    }

    const mediaPath = normalizePath(path.join('advertisements', mediaFile.filename));
    uploadedFiles.push(path.join('uploads', mediaPath));
    console.log('[CreateAd] Media file uploaded:', mediaPath);

    // Extract and validate thumbnail
    const thumbFile = filesByField['thumbnail'] && filesByField['thumbnail'][0];
    let thumbnailPath = null;
    
    if (thumbFile) {
      const thumbValidation = validateFileType(thumbFile, 'image');
      if (!thumbValidation.valid) {
        console.warn('[CreateAd] Invalid thumbnail, skipping:', thumbValidation.error);
      } else if (verifyUploadedFile(thumbFile)) {
        thumbnailPath = normalizePath(path.join('advertisements', thumbFile.filename));
        uploadedFiles.push(path.join('uploads', thumbnailPath));
        console.log('[CreateAd] Thumbnail uploaded:', thumbnailPath);
      }
    }

    // Category handling
    let isFeatured = req.body.isFeatured === 'true';
    let likes = 0;
    if (category === 'featured') {
      isFeatured = true;
    } else if (category === 'trending') {
      likes = 100;
    }

    // Extract and validate sponsor logo
    const sponsorLogoFile = filesByField['sponsorLogo'] && filesByField['sponsorLogo'][0];
    let sponsorLogoPath = null;
    
    if (sponsorLogoFile) {
      const logoValidation = validateFileType(sponsorLogoFile, 'image');
      if (!logoValidation.valid) {
        console.warn('[CreateAd] Invalid sponsor logo, skipping:', logoValidation.error);
      } else if (verifyUploadedFile(sponsorLogoFile)) {
        sponsorLogoPath = normalizePath(path.join('advertisements', sponsorLogoFile.filename));
        uploadedFiles.push(path.join('uploads', sponsorLogoPath));
        console.log('[CreateAd] Sponsor logo uploaded:', sponsorLogoPath);
      }
    }

    // Create advertisement document
    const newAd = new Advertisement({
      title,
      description,
      type: type || 'image',
      mediaUrl: mediaPath,
      thumbnailUrl: thumbnailPath,
      sponsorText: sponsorText || undefined,
      sponsorLogo: sponsorLogoPath,
      likes,
      isFeatured
    });

    // Save to database
    await newAd.save();
    console.log('[CreateAd] Advertisement saved to database:', newAd._id);
    
    res.status(201).json({ success: true, advertisement: newAd });
    
  } catch (error) {
    console.error('[CreateAd] Error creating advertisement:', error.message);
    
    // Rollback: Delete all uploaded files if database save failed
    if (uploadedFiles.length > 0) {
      console.log('[CreateAd] Rolling back uploaded files:', uploadedFiles);
      safeDeleteMultipleFiles(uploadedFiles);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create advertisement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'DATABASE_ERROR'
    });
  }
};

// Update advertisement
exports.updateAdvertisement = async (req, res) => {
  const newUploadedFiles = [];
  const oldFilesToDelete = [];
  
  try {
    const { id } = req.params;
    const { title, description, isFeatured, category, sponsorText } = req.body;
    const files = req.files || [];
    
    console.log('[UpdateAd] Starting advertisement update:', id);
    
    // Organize files by field name
    const filesByField = Array.isArray(files)
      ? files.reduce((acc, f) => {
          acc[f.fieldname] = acc[f.fieldname] || [];
          acc[f.fieldname].push(f);
          return acc;
        }, {})
      : files;

    // Find existing advertisement
    const ad = await Advertisement.findById(id);
    if (!ad) {
      // Clean up any uploaded files
      if (files.length > 0) {
        files.forEach(f => {
          safeDeleteFile(path.join('uploads', 'advertisements', f.filename));
        });
      }
      return res.status(404).json({ 
        success: false, 
        message: 'Advertisement not found',
        code: 'NOT_FOUND'
      });
    }

    // Handle media file update
    const mediaFile = (filesByField['media'] && filesByField['media'][0]) || (Array.isArray(files) && files[0]);
    if (mediaFile) {
      // Validate new media file
      const mediaValidation = validateFileType(mediaFile, ad.type);
      if (!mediaValidation.valid) {
        safeDeleteFile(path.join('uploads', 'advertisements', mediaFile.filename));
        return res.status(400).json({ 
          success: false, 
          message: mediaValidation.error,
          code: 'INVALID_FILE_TYPE'
        });
      }

      if (!verifyUploadedFile(mediaFile)) {
        return res.status(500).json({ 
          success: false, 
          message: 'Media file upload failed',
          code: 'FILE_UPLOAD_FAILED'
        });
      }

      const newMediaPath = normalizePath(path.join('advertisements', mediaFile.filename));
      newUploadedFiles.push(path.join('uploads', newMediaPath));
      
      // Mark old media for deletion
      if (ad.mediaUrl) {
        oldFilesToDelete.push(path.join('uploads', ad.mediaUrl));
      }
      
      ad.mediaUrl = newMediaPath;
      console.log('[UpdateAd] New media file:', newMediaPath);
    }

    // Handle thumbnail update
    const thumbFile = filesByField['thumbnail'] && filesByField['thumbnail'][0];
    if (thumbFile) {
      const thumbValidation = validateFileType(thumbFile, 'image');
      if (thumbValidation.valid && verifyUploadedFile(thumbFile)) {
        const newThumbPath = normalizePath(path.join('advertisements', thumbFile.filename));
        newUploadedFiles.push(path.join('uploads', newThumbPath));
        
        // Mark old thumbnail for deletion
        if (ad.thumbnailUrl) {
          oldFilesToDelete.push(path.join('uploads', ad.thumbnailUrl));
        }
        
        ad.thumbnailUrl = newThumbPath;
        console.log('[UpdateAd] New thumbnail:', newThumbPath);
      } else {
        safeDeleteFile(path.join('uploads', 'advertisements', thumbFile.filename));
        console.warn('[UpdateAd] Invalid thumbnail, keeping old one');
      }
    }

    // Handle sponsor logo update
    const sponsorLogoFile = filesByField['sponsorLogo'] && filesByField['sponsorLogo'][0];
    if (sponsorLogoFile) {
      const logoValidation = validateFileType(sponsorLogoFile, 'image');
      if (logoValidation.valid && verifyUploadedFile(sponsorLogoFile)) {
        const newLogoPath = normalizePath(path.join('advertisements', sponsorLogoFile.filename));
        newUploadedFiles.push(path.join('uploads', newLogoPath));
        
        // Mark old logo for deletion
        if (ad.sponsorLogo) {
          oldFilesToDelete.push(path.join('uploads', ad.sponsorLogo));
        }
        
        ad.sponsorLogo = newLogoPath;
        console.log('[UpdateAd] New sponsor logo:', newLogoPath);
      } else {
        safeDeleteFile(path.join('uploads', 'advertisements', sponsorLogoFile.filename));
        console.warn('[UpdateAd] Invalid sponsor logo, keeping old one');
      }
    }

    // Update text fields
    if (title) ad.title = title;
    if (description) ad.description = description;
    
    // Update category/featured status
    if (category) {
      if (category === 'featured') {
        ad.isFeatured = true;
      } else if (category === 'trending') {
        ad.likes = Math.max(ad.likes || 0, 100);
        ad.isFeatured = false;
      } else if (category === 'latest') {
        ad.isFeatured = false;
      }
    } else if (typeof isFeatured !== 'undefined') {
      ad.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    if (typeof sponsorText !== 'undefined') {
      ad.sponsorText = sponsorText;
    }

    // Save to database
    await ad.save();
    console.log('[UpdateAd] Advertisement updated in database');
    
    // Only delete old files after successful database update
    if (oldFilesToDelete.length > 0) {
      console.log('[UpdateAd] Deleting old files:', oldFilesToDelete);
      safeDeleteMultipleFiles(oldFilesToDelete);
    }
    
    res.status(200).json({ success: true, advertisement: ad });
    
  } catch (error) {
    console.error('[UpdateAd] Error updating advertisement:', error.message);
    
    // Rollback: Delete newly uploaded files if database update failed
    if (newUploadedFiles.length > 0) {
      console.log('[UpdateAd] Rolling back new files:', newUploadedFiles);
      safeDeleteMultipleFiles(newUploadedFiles);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update advertisement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'DATABASE_ERROR'
    });
  }
};

// Delete advertisement
exports.deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[DeleteAd] Starting advertisement deletion:', id);
    
    // Find and delete from database first
    const ad = await Advertisement.findByIdAndDelete(id);

    if (!ad) {
      return res.status(404).json({ 
        success: false, 
        message: 'Advertisement not found',
        code: 'NOT_FOUND'
      });
    }

    console.log('[DeleteAd] Advertisement deleted from database');

    // Collect files to delete
    const filesToDelete = [];
    if (ad.mediaUrl) {
      filesToDelete.push(path.join('uploads', ad.mediaUrl));
    }
    if (ad.thumbnailUrl) {
      filesToDelete.push(path.join('uploads', ad.thumbnailUrl));
    }
    if (ad.sponsorLogo) {
      filesToDelete.push(path.join('uploads', ad.sponsorLogo));
    }

    // Delete associated files (don't fail if files are missing)
    if (filesToDelete.length > 0) {
      console.log('[DeleteAd] Deleting associated files:', filesToDelete);
      const deleteResult = safeDeleteMultipleFiles(filesToDelete);
      
      if (deleteResult.errors.length > 0) {
        console.warn('[DeleteAd] Some files could not be deleted:', deleteResult.errors);
      } else {
        console.log('[DeleteAd] All files deleted successfully');
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Advertisement deleted successfully' 
    });
    
  } catch (error) {
    console.error('[DeleteAd] Error deleting advertisement:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete advertisement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'DATABASE_ERROR'
    });
  }
};

// Toggle like on advertisement
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const ad = await Advertisement.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    const likeIndex = ad.likedBy.indexOf(userId);
    if (likeIndex === -1) {
      ad.likedBy.push(userId);
      ad.likes += 1;
    } else {
      ad.likedBy.splice(likeIndex, 1);
      ad.likes -= 1;
    }

    await ad.save();
    res.status(200).json({ success: true, likes: ad.likes, isLiked: likeIndex === -1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check file integrity for an advertisement
exports.checkFileIntegrity = async (req, res) => {
  try {
    const { id } = req.params;
    const { validateVideoFile } = require('../../utils/videoValidator');
    
    const ad = await Advertisement.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    const results = {
      advertisementId: ad._id,
      title: ad.title,
      media: null,
      thumbnail: null
    };

    // Check media file
    if (ad.mediaUrl) {
      const mediaPath = path.join('uploads', ad.mediaUrl);
      results.media = {
        path: ad.mediaUrl,
        ...validateVideoFile(mediaPath)
      };
    }

    // Check thumbnail file
    if (ad.thumbnailUrl) {
      const thumbPath = path.join('uploads', ad.thumbnailUrl);
      results.thumbnail = {
        path: ad.thumbnailUrl,
        ...validateVideoFile(thumbPath)
      };
    }

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('[CheckIntegrity] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};