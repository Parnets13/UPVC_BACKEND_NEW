# Video Transcoding Setup

The backend now automatically transcodes uploaded videos to a mobile-compatible format (720p H.264 baseline profile) to ensure videos play on all Android devices.

## Requirements

**FFmpeg must be installed on your system** for video transcoding to work.

### Installing FFmpeg

#### Windows:
1. Download FFmpeg from: https://www.gyan.dev/ffmpeg/builds/
2. Extract the zip file
3. Add the `bin` folder to your system PATH
4. Verify installation: Open Command Prompt and run `ffmpeg -version`

#### macOS:
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg
```

## How It Works

1. When a video is uploaded through the admin panel, it's automatically transcoded to:
   - Resolution: 720p (1280x720)
   - Codec: H.264 baseline profile
   - Audio: AAC 128kbps
   - Optimized for mobile playback

2. The original video is deleted after successful transcoding to save storage space.

3. If FFmpeg is not available, the system will use the original video (with a warning).

## Testing

After uploading a video through the admin panel, check the backend console logs for:
- `[createHomepage] Transcoding video for mobile compatibility...`
- `[VideoTranscoder] Transcoding successful`
- `[VideoTranscoder] Output file size: X MB`

The transcoded video will have `_mobile.mp4` suffix in the filename.


