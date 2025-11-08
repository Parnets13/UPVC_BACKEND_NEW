const { VideoPrice, PriceHeading } = require('../../models/Admin/pricingModels');

// Utility function to normalize file paths
const normalizeFilePath = (path) => {
  if (!path) return '';
  // Replace backslashes with forward slashes and remove redundant slashes
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
};

exports.createVideoPrice = async (req, res) => {
  try {
    const { title, subtitle, description, } = req.body;
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

    if (!file) return res.status(400).json({ error: 'Video file is required' });

    const newVideo = new VideoPrice({
      video: normalizeFilePath(file.path),
      title,
      subtitle,
      description,
      sponsorLogo: req.files?.sponsorLogo?.[0]?.path,
      sponsorText: req.body.sponsorText
    });

    await newVideo.save();
    res.status(201).json(newVideo);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    const updatedData = { title, subtitle, description, sponsorText };
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