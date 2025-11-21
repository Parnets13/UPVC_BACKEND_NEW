const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * Transcode video to mobile-compatible format (720p H.264 baseline)
 * @param {string} inputPath - Path to input video file
 * @param {string} outputPath - Path to output video file
 * @returns {Promise<{success: boolean, outputPath?: string, error?: string}>}
 */
async function transcodeVideo(inputPath, outputPath) {
  try {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      return { success: false, error: 'Input video file does not exist' };
    }

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // FFmpeg command to transcode to 720p H.264 baseline profile (mobile-compatible)
    // -vf scale=1280:720: force 720p resolution
    // -c:v libx264: use H.264 codec
    // -profile:v baseline: use baseline profile (most compatible)
    // -level 3.0: H.264 level 3.0 (widely supported)
    // -preset medium: balance between speed and compression
    // -crf 23: quality setting (lower = better quality, 23 is good balance)
    // -c:a aac: use AAC audio codec
    // -b:a 128k: audio bitrate
    // -movflags +faststart: optimize for streaming
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2 -c:v libx264 -profile:v baseline -level 3.0 -preset medium -crf 23 -c:a aac -b:a 128k -movflags +faststart -y "${outputPath}"`;

    console.log('[VideoTranscoder] Starting transcoding...');
    console.log('[VideoTranscoder] Input:', inputPath);
    console.log('[VideoTranscoder] Output:', outputPath);

    const { stdout, stderr } = await execPromise(ffmpegCommand);

    // Check if output file was created
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log('[VideoTranscoder] Transcoding successful');
      console.log('[VideoTranscoder] Output file size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
      return { success: true, outputPath };
    } else {
      return { success: false, error: 'Transcoding completed but output file not found' };
    }
  } catch (error) {
    console.error('[VideoTranscoder] Error:', error.message);
    if (error.stderr) {
      console.error('[VideoTranscoder] FFmpeg stderr:', error.stderr);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Check if ffmpeg is available on the system
 * @returns {Promise<boolean>}
 */
async function checkFFmpegAvailable() {
  try {
    await execPromise('ffmpeg -version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Transcode video if needed (only if resolution > 720p or not baseline profile)
 * This is a simplified check - in production you might want to use ffprobe
 * @param {string} inputPath - Path to input video file
 * @param {string} outputPath - Path to output video file
 * @returns {Promise<{success: boolean, outputPath?: string, error?: string, transcoded?: boolean}>}
 */
async function transcodeVideoIfNeeded(inputPath, outputPath) {
  // Check if ffmpeg is available
  const ffmpegAvailable = await checkFFmpegAvailable();
  if (!ffmpegAvailable) {
    console.warn('[VideoTranscoder] FFmpeg not available, skipping transcoding');
    // If ffmpeg is not available, return the original file path
    return { success: true, outputPath: inputPath, transcoded: false };
  }

  // For now, always transcode to ensure compatibility
  // In production, you could use ffprobe to check video properties first
  const result = await transcodeVideo(inputPath, outputPath);
  return { ...result, transcoded: true };
}

module.exports = {
  transcodeVideo,
  transcodeVideoIfNeeded,
  checkFFmpegAvailable
};








