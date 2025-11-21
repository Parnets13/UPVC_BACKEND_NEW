/**
 * Script to transcode an existing video file to mobile-compatible format
 * Usage: node scripts/transcodeExistingVideo.js <video-filename>
 * Example: node scripts/transcodeExistingVideo.js 1763451066303-275857959.mp4
 */

const { transcodeVideo, checkFFmpegAvailable } = require('../utils/videoTranscoder');
const path = require('path');
const fs = require('fs');

async function main() {
  const videoFilename = process.argv[2];
  
  if (!videoFilename) {
    console.error('Usage: node scripts/transcodeExistingVideo.js <video-filename>');
    console.error('Example: node scripts/transcodeExistingVideo.js 1763451066303-275857959.mp4');
    process.exit(1);
  }

  // Check if FFmpeg is available
  const ffmpegAvailable = await checkFFmpegAvailable();
  if (!ffmpegAvailable) {
    console.error('❌ FFmpeg is not installed or not in PATH');
    console.error('Please install FFmpeg first:');
    console.error('  Windows: Download from https://www.gyan.dev/ffmpeg/builds/');
    console.error('  macOS: brew install ffmpeg');
    console.error('  Linux: sudo apt install ffmpeg');
    process.exit(1);
  }

  const inputPath = path.join(__dirname, '..', 'uploads', 'advertisements', videoFilename);
  const outputPath = inputPath.replace(/\.(mp4|webm|ogg)$/i, '_mobile.mp4');

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Video file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log('📹 Starting video transcoding...');
  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);

  const result = await transcodeVideo(inputPath, outputPath);

  if (result.success) {
    console.log('✅ Video transcoded successfully!');
    console.log(`Output file: ${result.outputPath}`);
    
    // Get file sizes
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);
    console.log(`\nFile sizes:`);
    console.log(`  Original: ${(inputStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Transcoded: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n⚠️  Note: You need to update the database to use the transcoded video.');
    console.log(`   Update videoUrl to: uploads/advertisements/${path.basename(outputPath)}`);
  } else {
    console.error('❌ Transcoding failed:', result.error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});








