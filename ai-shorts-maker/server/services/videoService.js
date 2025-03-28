/**
 * Validates video URL and extracts metadata
 * @param {string} url - Video URL to validate
 * @returns {Object} Validation result with platform and videoId if valid
 */
const validateVideoUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // YouTube validation
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      let videoId;

      if (hostname.includes('youtu.be')) {
        // Short YouTube URL format (youtu.be/VIDEO_ID)
        videoId = urlObj.pathname.split('/')[1];
      } else {
        // Standard YouTube URL format
        videoId = new URLSearchParams(urlObj.search).get('v');
      }

      if (videoId) {
        return {
          isValid: true,
          platform: 'youtube',
          videoId
        };
      }
    }

    // Vimeo validation
    else if (hostname.includes('vimeo.com')) {
      // Vimeo URL format: vimeo.com/VIDEO_ID
      const videoId = urlObj.pathname.split('/')[1];
      console.log(`Vimeo URL detected: ${url}`);
      console.log(`Extracted videoId: ${videoId}`);
      console.log(`Is videoId numeric: ${/^\d+$/.test(videoId)}`);

      if (videoId && /^\d+$/.test(videoId)) {
        console.log('Vimeo URL validation successful');
        return {
          isValid: true,
          platform: 'vimeo',
          videoId
        };
      } else {
        console.log(`Vimeo URL validation failed: ${videoId ? 'ID format invalid' : 'No ID found'}`);
      }
    }

    // TikTok validation
    else if (hostname.includes('tiktok.com')) {
      // TikTok URL format: tiktok.com/@username/video/VIDEO_ID
      const pathSegments = urlObj.pathname.split('/');
      const videoPosition = pathSegments.indexOf('video');

      if (videoPosition !== -1 && videoPosition + 1 < pathSegments.length) {
        const videoId = pathSegments[videoPosition + 1];
        if (videoId) {
          return {
            isValid: true,
            platform: 'tiktok',
            videoId
          };
        }
      }
    }

    // Instagram validation
    else if (hostname.includes('instagram.com')) {
      // Instagram URL format: instagram.com/p/CODE/ or instagram.com/reel/CODE/
      const pathSegments = urlObj.pathname.split('/');
      if ((pathSegments[1] === 'p' || pathSegments[1] === 'reel') && pathSegments[2]) {
        return {
          isValid: true,
          platform: 'instagram',
          videoId: pathSegments[2]
        };
      }
    }

    // Facebook validation
    else if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
      // Facebook has several URL formats
      if (hostname.includes('fb.watch')) {
        // Short link format
        return {
          isValid: true,
          platform: 'facebook',
          videoId: urlObj.pathname.substring(1)
        };
      }

      // Other Facebook video URL formats
      if (urlObj.pathname.includes('/videos/')) {
        const videoId = urlObj.pathname.split('/videos/')[1].split('/')[0];
        return {
          isValid: true,
          platform: 'facebook',
          videoId
        };
      }
    }

    // Twitter/X validation
    else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      // Twitter URL format: twitter.com/username/status/TWEET_ID
      if (urlObj.pathname.includes('/status/')) {
        const tweetId = urlObj.pathname.split('/status/')[1];
        return {
          isValid: true,
          platform: 'twitter',
          videoId: tweetId
        };
      }
    }

    // URL didn't match any supported video platform
    return { isValid: false };
  } catch (error) {
    console.error('Error validating URL:', error);
    return { isValid: false, error: 'Invalid URL format' };
  }
};

module.exports = {
  validateVideoUrl
};