const Advertisement = require('../../models/Admin/Advertisement');
const fs = require('fs');
const path = require('path');

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
  try {
    const { title, description, type, category, sponsorText } = req.body;
    const files = req.files || [];
    const filesByField = Array.isArray(files)
      ? files.reduce((acc, f) => {
          acc[f.fieldname] = acc[f.fieldname] || [];
          acc[f.fieldname].push(f);
          return acc;
        }, {})
      : files;

    const mediaFile = (filesByField['media'] && filesByField['media'][0]) || (Array.isArray(files) && files[0]);
    const mediaPath = mediaFile ? path.join('advertisements', mediaFile.filename) : null;
    const thumbFile = filesByField['thumbnail'] && filesByField['thumbnail'][0];
    const thumbnailPath = thumbFile ? path.join('advertisements', thumbFile.filename) : null;
    if (!mediaPath) {
      return res.status(400).json({ success: false, message: 'Media file is required' });
    }


    // Determine category flags
    let isFeatured = req.body.isFeatured === 'true';
    let likes = 0;
    if (category === 'featured') {
      isFeatured = true;
    } else if (category === 'trending') {
      likes = 100; // ensures it appears in trending
    }

    const sponFile = filesByField['sponsorLogo'] && filesByField['sponsorLogo'][0];
    const sponsorLogoPath = sponFile ? path.join('advertisements', sponFile.filename) : null;

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

    await newAd.save();
    res.status(201).json({ success: true, advertisement: newAd });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update advertisement
exports.updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isFeatured, category, sponsorText } = req.body;
    const files = req.files || [];
    const filesByField = Array.isArray(files)
      ? files.reduce((acc, f) => {
          acc[f.fieldname] = acc[f.fieldname] || [];
          acc[f.fieldname].push(f);
          return acc;
        }, {})
      : files;

    const ad = await Advertisement.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    // Delete old files if new ones are uploaded
    if ((filesByField['media'] && filesByField['media'][0]) || (Array.isArray(files) && files[0])) {
      if (ad.mediaUrl && fs.existsSync(path.join('uploads', ad.mediaUrl))) {
        try { fs.unlinkSync(path.join('uploads', ad.mediaUrl)); } catch (e) { /* ignore */ }
      }
      const f = (filesByField['media'] && filesByField['media'][0]) || files[0];
      ad.mediaUrl = path.join('advertisements', f.filename);
    }

    if (filesByField['thumbnail'] && filesByField['thumbnail'][0]) {
      if (ad.thumbnailUrl && fs.existsSync(path.join('uploads', ad.thumbnailUrl))) {
        try { fs.unlinkSync(path.join('uploads', ad.thumbnailUrl)); } catch (e) { /* ignore */ }
      }
      ad.thumbnailUrl = path.join('advertisements', filesByField['thumbnail'][0].filename);
    }

    if (filesByField['sponsorLogo'] && filesByField['sponsorLogo'][0]) {
      if (ad.sponsorLogo && fs.existsSync(path.join('uploads', ad.sponsorLogo))) {
        try { fs.unlinkSync(path.join('uploads', ad.sponsorLogo)); } catch (e) { /* ignore */ }
      }
      ad.sponsorLogo = path.join('advertisements', filesByField['sponsorLogo'][0].filename);
    }

    ad.title = title || ad.title;
    ad.description = description || ad.description;
    if (typeof sponsorText !== 'undefined') {
      ad.sponsorText = sponsorText;
    }
    // Update category flags if provided
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

    await ad.save();
    res.status(200).json({ success: true, advertisement: ad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete advertisement
exports.deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Advertisement.findByIdAndDelete(id);

    if (!ad) {
      return res.status(404).json({ success: false, message: 'Advertisement not found' });
    }

    // Delete associated files
    if (ad.mediaUrl && fs.existsSync(path.join('uploads', ad.mediaUrl))) {
      try { fs.unlinkSync(path.join('uploads', ad.mediaUrl)); } catch (e) { /* ignore */ }
    }
    if (ad.thumbnailUrl && fs.existsSync(path.join('uploads', ad.thumbnailUrl))) {
      try { fs.unlinkSync(path.join('uploads', ad.thumbnailUrl)); } catch (e) { /* ignore */ }
    }
    if (ad.sponsorLogo && fs.existsSync(path.join('uploads', ad.sponsorLogo))) {
      try { fs.unlinkSync(path.join('uploads', ad.sponsorLogo)); } catch (e) { /* ignore */ }
    }

    res.status(200).json({ success: true, message: 'Advertisement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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