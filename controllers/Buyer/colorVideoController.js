const fs = require('fs');
const path = require('path');

const ColorVideo = require('../../models/Buyer/ColorVideo');
// Utility function to normalize file paths
const normalizeFilePath = (path) => {
  if (!path) return '';
  // Replace backslashes with forward slashes and remove redundant slashes
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
};
// CREATE
const createColorVideo = async (req, res) => {
  try {
    const { title, description } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Video file is required' });

    const normalizedPath = normalizeFilePath(file.path);

    const newVideo = new ColorVideo({
      title,
      description,
      src: normalizedPath,
      filename: file.originalname,
      filepath: normalizedPath,
      mimetype: file.mimetype,
      filesize: file.size,
      sponsorLogo: req.files?.sponsorLogo?.[0]?.path,
      sponsorText: req.body.sponsorText
    });

    await newVideo.save();
    res.status(201).json({ message: 'Uploaded successfully', data: newVideo });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllColorVideos = async (req, res) => {
  try {
    const videos = await ColorVideo.find().sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
};

const getColorVideoById = async (req, res) => {
  try {
    const video = await ColorVideo.findById(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    res.status(200).json(video);
  } catch (error) {
    console.error('Get by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// UPDATE
const updateColorVideo = async (req, res) => {
  try {
    const { title, description, sponsorText } = req.body;
    const videoId = req.params.id;
    const file = req.file;

    const existing = await ColorVideo.findById(videoId);
    if (!existing) return res.status(404).json({ error: 'Video not found' });

    // Prepare update data
    const updateData = {
      title: title || existing.title,
      description: description || existing.description,
      sponsorText: sponsorText || existing.sponsorText
    };

    // If a new file is uploaded
    if (file) {
      const newFilePath = normalizeFilePath(file.path);

      // Delete old file
      const oldPath = normalizeFilePath(existing.filepath);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(path.resolve(oldPath));
      }

      // Assign new file details
      updateData.src = newFilePath;
      updateData.filepath = newFilePath;
      updateData.filename = file.originalname;
      updateData.mimetype = file.mimetype;
      updateData.filesize = file.size;
    }
    if (req.files?.sponsorLogo?.[0]) { 
      updateData.sponsorLogo = req.files.sponsorLogo[0].path;
    }

    const updated = await ColorVideo.findByIdAndUpdate(videoId, updateData, {
      new: true
    });

    res.status(200).json({
      message: 'Color video updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE
const deleteColorVideo = async (req, res) => {
  try {
    const video = await ColorVideo.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const fileToDelete = normalizeFilePath(video.filepath);
    if (fileToDelete && fs.existsSync(fileToDelete)) {
      fs.unlinkSync(path.resolve(fileToDelete));
    }

    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
};

module.exports = {
  createColorVideo,
  getAllColorVideos,
  getColorVideoById,
  updateColorVideo,
  deleteColorVideo,
};
