const fs = require('fs');
const path = require('path');

/**
 * Safely delete a file without throwing errors if it doesn't exist
 * @param {string} filePath - Relative path from project root
 * @returns {Object} { success: boolean, error?: string }
 */
const safeDeleteFile = (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    // Check if file exists before attempting deletion
    if (!fs.existsSync(fullPath)) {
      console.warn(`[FileHelper] File not found, skipping deletion: ${filePath}`);
      return { success: true, message: 'File does not exist' };
    }
    
    // Delete the file
    fs.unlinkSync(fullPath);
    console.log(`[FileHelper] Successfully deleted file: ${filePath}`);
    return { success: true };
    
  } catch (error) {
    console.error(`[FileHelper] Error deleting file ${filePath}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Check if a file exists
 * @param {string} filePath - Relative path from project root
 * @returns {boolean}
 */
const fileExists = (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    return fs.existsSync(fullPath);
  } catch (error) {
    console.error(`[FileHelper] Error checking file existence ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Normalize file path for consistent storage
 * Removes leading slashes and ensures format: "advertisements/filename.ext"
 * @param {string} filePath - Any path format
 * @returns {string} Normalized path
 */
const normalizePath = (filePath) => {
  if (!filePath) return '';
  
  // Remove leading slash
  let normalized = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  
  // Remove 'uploads/' prefix if present (we'll add it when serving)
  if (normalized.startsWith('uploads/')) {
    normalized = normalized.substring('uploads/'.length);
  }
  
  return normalized;
};

/**
 * Validate file type matches expected type
 * @param {Object} file - Multer file object
 * @param {string} expectedType - 'image' or 'video'
 * @returns {Object} { valid: boolean, error?: string }
 */
const validateFileType = (file, expectedType) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const fileMimeType = file.mimetype.toLowerCase();
  
  if (expectedType === 'video') {
    const validMime = videoMimeTypes.includes(fileMimeType);
    const validExt = videoExtensions.includes(fileExtension);
    
    if (!validMime && !validExt) {
      return { 
        valid: false, 
        error: `Invalid video file. Expected formats: ${videoExtensions.join(', ')}` 
      };
    }
  } else if (expectedType === 'image') {
    const validMime = imageMimeTypes.includes(fileMimeType);
    const validExt = imageExtensions.includes(fileExtension);
    
    if (!validMime && !validExt) {
      return { 
        valid: false, 
        error: `Invalid image file. Expected formats: ${imageExtensions.join(', ')}` 
      };
    }
  }
  
  return { valid: true };
};

/**
 * Verify uploaded file exists on disk
 * @param {Object} file - Multer file object
 * @returns {boolean}
 */
const verifyUploadedFile = (file) => {
  if (!file || !file.path) {
    console.error('[FileHelper] File object missing or no path');
    return false;
  }
  
  const exists = fs.existsSync(file.path);
  if (!exists) {
    console.error(`[FileHelper] Uploaded file not found at: ${file.path}`);
  }
  
  return exists;
};

/**
 * Delete multiple files safely
 * @param {Array<string>} filePaths - Array of file paths to delete
 * @returns {Object} { success: boolean, deletedCount: number, errors: Array }
 */
const safeDeleteMultipleFiles = (filePaths) => {
  const results = {
    success: true,
    deletedCount: 0,
    errors: []
  };
  
  if (!Array.isArray(filePaths)) {
    return { success: false, deletedCount: 0, errors: ['Invalid input: expected array'] };
  }
  
  filePaths.forEach(filePath => {
    if (filePath) {
      const result = safeDeleteFile(filePath);
      if (result.success) {
        results.deletedCount++;
      } else {
        results.errors.push({ path: filePath, error: result.error });
      }
    }
  });
  
  if (results.errors.length > 0) {
    results.success = false;
  }
  
  return results;
};

module.exports = {
  safeDeleteFile,
  fileExists,
  normalizePath,
  validateFileType,
  verifyUploadedFile,
  safeDeleteMultipleFiles
};
