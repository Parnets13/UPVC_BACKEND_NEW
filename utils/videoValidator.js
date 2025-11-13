const fs = require('fs');
const path = require('path');

/**
 * Validate video file integrity
 * @param {string} filePath - Path to video file
 * @returns {Object} { valid: boolean, error?: string, size?: number }
 */
const validateVideoFile = (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return { valid: false, error: 'File does not exist' };
    }
    
    // Get file stats
    const stats = fs.statSync(fullPath);
    
    // Check if file is empty
    if (stats.size === 0) {
      return { valid: false, error: 'File is empty (0 bytes)' };
    }
    
    // Check if file is suspiciously small (less than 1KB)
    if (stats.size < 1024) {
      return { valid: false, error: `File too small (${stats.size} bytes)` };
    }
    
    // Try to read first few bytes to ensure file is readable
    try {
      const fd = fs.openSync(fullPath, 'r');
      const buffer = Buffer.allocUnsafe(100);
      fs.readSync(fd, buffer, 0, 100, 0);
      fs.closeSync(fd);
    } catch (readError) {
      return { valid: false, error: `File not readable: ${readError.message}` };
    }
    
    return { 
      valid: true, 
      size: stats.size,
      sizeFormatted: formatBytes(stats.size)
    };
    
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

module.exports = {
  validateVideoFile,
  formatBytes
};
