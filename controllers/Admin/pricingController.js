const { VideoPrice, PriceHeading } = require('../../models/Admin/pricingModels');

// Utility function to normalize file paths
const normalizeFilePath = (filePath) => {
  if (!filePath) return '';
  
  // Replace backslashes with forward slashes
  let normalized = filePath.replace(/\\/g, '/');
  
  // Remove redundant slashes
  normalized = normalized.replace(/\/+/g, '/');
  
  // If it's an absolute path, extract the relative path from 'uploads' directory
  // e.g., 'uploads/video/filename.mp4' or 'D:/path/uploads/video/filename.mp4' -> '/uploads/video/filename.mp4'
  const uploadsIndex = normalized.indexOf('uploads/');
  if (uploadsIndex !== -1) {
    normalized = normalized.substring(uploadsIndex);
  } else if (!normalized.startsWith('/uploads/')) {
    // If path doesn't contain 'uploads/', assume it's relative to uploads
    normalized = '/uploads/' + normalized.replace(/^\//, '');
  }
  
  // Ensure it starts with a forward slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  
  return normalized;
};

exports.createVideoPrice = async (req, res) => {
  try {
    console.log('=== Create Video Price ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    console.log('req.files:', req.files);
    
    const { title, subtitle, description } = req.body;
    
    if (!title || !subtitle) {
      return res.status(400).json({ error: 'Title and subtitle are required' });
    }
    
    // Ensure description is always a string (default to empty string if not provided)
    const videoDescription = description || '';
    
    // Support both .single('video') and .fields. If field name differs, fall back to first file.
    let file = req.file || req.files?.video?.[0];
    if (!file && Array.isArray(req.files) && req.files.length > 0) {
      file = req.files[0];
    }
    if (!file && req.files && typeof req.files === 'object') {
      const firstKey = Object.keys(req.files)[0];
      if (firstKey && Array.isArray(req.files[firstKey]) && req.files[firstKey][0]) {
        file = req.files[firstKey][0];
      }
    }

    if (!file) {
      console.error('No file found in request');
      return res.status(400).json({ error: 'Video file is required' });
    }

    console.log('File found:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    });

    const videoPath = normalizeFilePath(file.path);
    console.log('Normalized video path:', videoPath);
    
    // Handle sponsor logo if present
    let sponsorLogoPath = null;
    if (req.files && req.files.sponsorLogo && req.files.sponsorLogo[0]) {
      sponsorLogoPath = normalizeFilePath(req.files.sponsorLogo[0].path);
      console.log('Sponsor logo path:', sponsorLogoPath);
    }

    const newVideo = new VideoPrice({
      video: videoPath,
      title,
      subtitle,
      description: videoDescription,
      sponsorLogo: sponsorLogoPath,
      sponsorText: req.body.sponsorText || ''
    });

    console.log('Saving video:', newVideo);
    await newVideo.save();
    console.log('Video saved successfully');
    res.status(201).json(newVideo);
  } catch (err) {
    console.error('Error creating video price:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.getAllVideoPrices = async (req, res) => {
  try {
    const videos = await VideoPrice.find().sort({ createdAt: -1 });
    // Normalize video paths in response
    const normalizedVideos = videos.map(video => ({
      ...video._doc,
      video: normalizeFilePath(video.video)
    }));
    res.json(normalizedVideos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVideoPriceById = async (req, res) => {
  try {
    const video = await VideoPrice.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });
    // Normalize video path in response
    res.json({
      ...video._doc,
      video: normalizeFilePath(video.video)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateVideoPrice = async (req, res) => {
  try {
    const { title, subtitle, description, sponsorText } = req.body;
    let file = req.file || req.files?.video?.[0];
    if (!file && Array.isArray(req.files) && req.files.length > 0) {
      file = req.files[0];
    }
    if (!file && req.files && typeof req.files === 'object') {
      const firstKey = Object.keys(req.files)[0];
      if (firstKey && Array.isArray(req.files[firstKey]) && req.files[firstKey][0]) {
        file = req.files[firstKey][0];
      }
    }

    const updatedData = { 
      title, 
      subtitle, 
      description: description || '', // Ensure description is always a string
      sponsorText: sponsorText || ''
    };
    if (file) updatedData.video = normalizeFilePath(file.path);
    if (req.files?.sponsorLogo?.[0]) { 
      updatedData.sponsorLogo = req.files.sponsorLogo[0].path;
    }
    const updated = await VideoPrice.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    if (!updated) return res.status(404).json({ error: 'Video not found' });
    // Normalize video path in response
    res.json({
      ...updated._doc,
      video: normalizeFilePath(updated.video)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteVideoPrice = async (req, res) => {
  try {
    const deleted = await VideoPrice.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Video not found' });
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPriceHeading = async (req, res) => {
  try {
    const { type, data , head} = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Image file is required' });

    const newHeading = new PriceHeading({
      image: normalizeFilePath(file.path),
      type,
      data,
      head
    });

    await newHeading.save();
    res.status(201).json(newHeading);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllPriceHeadings = async (req, res) => {
  try {
    const headings = await PriceHeading.find().sort({ createdAt: -1 });
    // Normalize image paths in response
    const normalizedHeadings = headings.map(heading => ({
      ...heading._doc,
      image: normalizeFilePath(heading.image)
    }));
    res.json(normalizedHeadings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPriceHeadingById = async (req, res) => {
  try {
    const heading = await PriceHeading.findById(req.params.id);
    if (!heading) return res.status(404).json({ error: 'Heading not found' });
    // Normalize image path in response
    res.json({
      ...heading._doc,
      image: normalizeFilePath(heading.image)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePriceHeading = async (req, res) => {
  try {
    const { type, data , head} = req.body;
    const file = req.file;

    const updatedData = { type, data , head};
    if (file) updatedData.image = normalizeFilePath(file.path);

    const updated = await PriceHeading.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    if (!updated) return res.status(404).json({ error: 'Heading not found' });
    // Normalize image path in response
    res.json({
      ...updated._doc,
      image: normalizeFilePath(updated.image)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePriceHeading = async (req, res) => {
  try {
    const deleted = await PriceHeading.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Heading not found' });
    res.json({ message: 'Heading deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};