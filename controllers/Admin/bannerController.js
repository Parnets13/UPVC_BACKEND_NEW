const { error } = require('console');
const Banner = require('../../models/Admin/Banner');
const { unlink } = require('fs').promises;
const fs = require('fs');

// 🔧 Helper to normalize paths (for Windows compatibility)
const normalizePath = (filePath) => filePath.replace(/\\/g, '/');

exports.createBanner = async (req, res) => {
  try {
    if (
      !req.files?.video?.[0] ||
      !req.files?.chapterThumbnail0?.[0] ||
      !req.files?.chapterThumbnail1?.[0] ||
      !req.files?.chapterThumbnail2?.[0] ||
      !req.files?.chapterThumbnail3?.[0]
    ) {
      return res.status(400).json({
        error: "Video, thumbnail, and exactly four chapter thumbnails are required"
      });
    }

    const { title, description, time, moment_title } = req.body;
    if (!time || !moment_title) {
      return res.status(400).json({
        error: "Both time and moment_title are required fields"
      });
    }

    const videoFile = req.files.video[0];

    const chapters = [0, 1, 2, 3].map(index => {
      const thumbFile = req.files[`chapterThumbnail${index}`][0];
      return {
        time: req.body[`chapterTime${index}`] || 0,
        title: req.body[`chapterTitle${index}`] || `Chapter ${index + 1}`,
        duration: req.body[`chapterDuration${index}`] || "0:00",
        thumbnailFilename: thumbFile.filename,
        thumbnailFilepath: normalizePath(thumbFile.path),
        thumbnailMimetype: thumbFile.mimetype,
        thumbnailFilesize: thumbFile.size
      };
    });

    const banner = new Banner({
      title,
      description,
      time: parseInt(time),
      moment_title,
      filename: videoFile.filename,
      filepath: normalizePath(videoFile.path),
      mimetype: videoFile.mimetype,
      filesize: videoFile.size,
      chapters
    });

    await banner.save();
    res.status(201).json(banner);

  } catch (err) {
    if (req.files) {
      Object.values(req.files).forEach(fileGroup => {
        fileGroup.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (fileErr) {
            console.error("Error deleting file:", fileErr);
          }
        });
      });
    }
    console.log(err.message)
    res.status(500).json({ error: err.message });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });
    res.json(banner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { title, description, moment_title, time, duration } = req.body;
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];
    const chapterFiles = req.files?.chapters || [];

    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    banner.title = title || banner.title;
    banner.description = description || banner.description;
    banner.moment_title = moment_title || banner.moment_title;
    banner.time = time ? Number(time) : banner.time;
    banner.duration = duration || banner.duration;

    if (videoFile) {
      if (banner.filepath) {
        await unlink(banner.filepath).catch(err => console.error('Error deleting old video file:', err));
      }
      banner.filename = videoFile.filename;
      banner.filepath = normalizePath(videoFile.path);
      banner.mimetype = videoFile.mimetype;
      banner.filesize = videoFile.size;
    }

    if (thumbnailFile) {
      if (banner.thumbnailFilepath) {
        await unlink(banner.thumbnailFilepath).catch(err => console.error('Error deleting old thumbnail file:', err));
      }
      banner.thumbnailFilename = thumbnailFile.filename;
      banner.thumbnailFilepath = normalizePath(thumbnailFile.path);
      banner.thumbnailMimetype = thumbnailFile.mimetype;
      banner.thumbnailFilesize = thumbnailFile.size;
    }

    if (req.body.chapters) {
      let parsedChapters;

      try {
        parsedChapters = JSON.parse(req.body.chapters);
      } catch (parseError) {
        console.error('Error parsing chapters:', parseError);
        return res.status(400).json({ error: 'Invalid chapters format. Must be valid JSON' });
      }

      if (!Array.isArray(parsedChapters)) {
        return res.status(400).json({ error: 'Chapters must be an array' });
      }

      if (parsedChapters.length !== 4) {
        return res.status(400).json({ error: 'Exactly four chapters are required' });
      }

      for (let i = 0; i < parsedChapters.length; i++) {
        if (chapterFiles[i] && banner.chapters[i]?.thumbnailFilepath) {
          await unlink(banner.chapters[i].thumbnailFilepath)
            .catch(err => console.error('Error deleting old chapter thumbnail:', err));
        }
      }

      banner.chapters = parsedChapters.map((chapter, index) => {
        const newThumbnail = chapterFiles[index];
        const oldChapter = banner.chapters[index] || {};

        return {
          title: chapter.title || oldChapter.title,
          time: Number(chapter.time) || oldChapter.time || 0,
          duration: chapter.duration || oldChapter.duration || "0:00",
          thumbnailFilename: newThumbnail?.filename || oldChapter.thumbnailFilename,
          thumbnailFilepath: newThumbnail ? normalizePath(newThumbnail.path) : oldChapter.thumbnailFilepath,
          thumbnailMimetype: newThumbnail?.mimetype || oldChapter.thumbnailMimetype,
          thumbnailFilesize: newThumbnail?.size || oldChapter.thumbnailFilesize
        };
      });
    }

    const updatedBanner = await banner.save();
    res.json(updatedBanner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ error: 'Banner not found' });

    const deletePromises = [];

    if (banner.filepath) {
      deletePromises.push(unlink(banner.filepath).catch(err => console.error('Error deleting video file:', err)));
    }

    if (banner.thumbnailFilepath) {
      deletePromises.push(unlink(banner.thumbnailFilepath).catch(err => console.error('Error deleting thumbnail file:', err)));
    }

    for (const chapter of banner.chapters) {
      if (chapter.thumbnailFilepath) {
        deletePromises.push(unlink(chapter.thumbnailFilepath).catch(err => console.error('Error deleting chapter thumbnail:', err)));
      }
    }

    await Promise.all(deletePromises);
    res.json({ message: 'Banner deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
