
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Default allowed file types
const defaultAllowedTypes = ['image/', 'video/', 'application/pdf'];

// Video-specific configuration
const videoConfig = {
  allowedTypes: ['video/mp4', 'video/webm', 'video/ogg'],
  // Increase max upload size for videos (1GB)
  maxSize: 1024 * 1024 * 1024,
  destination: 'uploads/sellers/videos'
};

// Universal multer middleware generator
const upload = (folder, allowedTypes = defaultAllowedTypes) => {
  // Special handling for videos
  if (folder === 'sellers/videos' || folder === 'sub-options/videos') {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const dir = folder === 'sellers/videos' 
          ? path.join(videoConfig.destination)
          : path.join('uploads', folder);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      console.log("file.mimetype : " , file.mimetype)
      if (videoConfig.allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Only video files are allowed (${videoConfig.allowedTypes.join(', ')})`), false);
      }
    };

    return multer({ 
      storage, 
      fileFilter,
      limits: { fileSize: videoConfig.maxSize }
    });
  }

  // Default handling for other uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join('uploads', folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const fileFilter = (req, file, cb) => {
    const isValid = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.mimetype.startsWith(type.replace('/*', '/'));
      }
      return file.mimetype === type;
    });

    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`), false);
    }
  };

  // Special handling for advertisements folder (can contain videos)
  const fileSizeLimit = folder === 'advertisements' 
    ? 1024 * 1024 * 1024 // 1GB for advertisements (videos)
    : 100 * 1024 * 1024; // 100MB for other uploads

  return multer({
    storage,
    // fileFilter,
    limits: {
      fileSize: fileSizeLimit
    }
  });
};

// Add direct video upload method to maintain backward compatibility
upload.video = (fieldName) => {
  return upload('sellers/videos').single(fieldName);
};

module.exports = upload;