const ytdl = require('youtube-dl-exec');
const fetch = require('node-fetch');
const { validateVideoUrl } = require('./videoService');

/**
 * Fetches metadata for a video URL from supported platforms
 * @param {string} url - The video URL
 * @returns {Promise<Object>} Video metadata including title, description, duration, and thumbnail
 */
const fetchVideoMetadata = async (url) => {
  try {
    // First validate if the URL is from a supported platform
    const validation = validateVideoUrl(url);

    if (!validation.isValid) {
      throw new Error('Unsupported video URL');
    }

    const { platform, videoId } = validation;

    // Use different strategies based on the platform
    switch (platform) {
      case 'youtube':
        return await fetchYouTubeMetadata(url);
      case 'vimeo':
        return await fetchVimeoMetadata(videoId);
      case 'tiktok':
        return await fetchTikTokMetadata(url);
      case 'instagram':
        return await fetchInstagramMetadata(url);
      case 'facebook':
        return await fetchFacebookMetadata(url);
      case 'twitter':
        return await fetchTwitterMetadata(url);
      default:
        // If we can't handle this platform specifically, use youtube-dl as fallback
        return await fetchGenericMetadata(url);
    }
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw new Error(`Failed to fetch video metadata: ${error.message}`);
  }
};

/**
 * Fetches metadata for a YouTube video
 * @param {string} url - YouTube video URL
 * @returns {Promise<Object>} Video metadata
 */
const fetchYouTubeMetadata = async (url) => {
  try {
    // Using youtube-dl to get metadata
    const options = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    };

    const output = await ytdl(url, options);

    return {
      title: output.title,
      description: output.description || '',
      duration: output.duration,
      thumbnail: output.thumbnail || output.thumbnails?.[0]?.url,
      platform: 'youtube',
      videoId: output.id,
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);

    // Mock response for development if youtube-dl fails
    return mockYouTubeMetadata(url);
  }
};

/**
 * Mock YouTube metadata for development or when API fails
 * @param {string} url - YouTube video URL
 * @returns {Object} Mocked video metadata
 */
const mockYouTubeMetadata = (url) => {
  const validation = validateVideoUrl(url);
  const videoId = validation.videoId;

  return {
    title: `YouTube Video (ID: ${videoId})`,
    description: 'This is a mocked description for a YouTube video.',
    duration: 360, // 6 minutes
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    platform: 'youtube',
    videoId: videoId,
  };
};

/**
 * Fetches metadata for a Vimeo video
 * @param {string} videoId - Vimeo video ID
 * @returns {Promise<Object>} Video metadata
 */
const fetchVimeoMetadata = async (videoId) => {
  try {
    // Fetch from Vimeo oEmbed API
    const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);

    if (!response.ok) {
      throw new Error(`Vimeo API responded with ${response.status}`);
    }

    const data = await response.json();
    const videoData = data[0] || {};

    return {
      title: videoData.title || `Vimeo Video (ID: ${videoId})`,
      description: videoData.description || '',
      duration: videoData.duration || 0,
      thumbnail: videoData.thumbnail_large || videoData.thumbnail_medium || '',
      platform: 'vimeo',
      videoId: videoId,
    };
  } catch (error) {
    console.error('Error fetching Vimeo metadata:', error);

    // Mock response for development if Vimeo API fails
    return {
      title: `Vimeo Video (ID: ${videoId})`,
      description: 'This is a mocked description for a Vimeo video.',
      duration: 240, // 4 minutes
      thumbnail: 'https://i.vimeocdn.com/video/default.jpg',
      platform: 'vimeo',
      videoId: videoId,
    };
  }
};

/**
 * Fetches metadata for a TikTok video using youtube-dl
 * @param {string} url - TikTok video URL
 * @returns {Promise<Object>} Video metadata
 */
const fetchTikTokMetadata = async (url) => {
  try {
    return await fetchGenericMetadata(url, 'tiktok');
  } catch (error) {
    console.error('Error fetching TikTok metadata:', error);
    const validation = validateVideoUrl(url);

    // Mock response for development if API fails
    return {
      title: `TikTok Video (ID: ${validation.videoId})`,
      description: 'TikTok video',
      duration: 30, // Typical TikTok length
      thumbnail: '',
      platform: 'tiktok',
      videoId: validation.videoId,
    };
  }
};

/**
 * Fetches metadata for an Instagram video using youtube-dl
 * @param {string} url - Instagram video URL
 * @returns {Promise<Object>} Video metadata
 */
const fetchInstagramMetadata = async (url) => {
  try {
    return await fetchGenericMetadata(url, 'instagram');
  } catch (error) {
    console.error('Error fetching Instagram metadata:', error);
    const validation = validateVideoUrl(url);

    // Mock response for development if API fails
    return {
      title: `Instagram Video (ID: ${validation.videoId})`,
      description: 'Instagram video',
      duration: 60, // Typical Instagram length
      thumbnail: '',
      platform: 'instagram',
      videoId: validation.videoId,
    };
  }
};

/**
 * Fetches metadata for a Facebook video using youtube-dl
 * @param {string} url - Facebook video URL
 * @returns {Promise<Object>} Video metadata
 */
const fetchFacebookMetadata = async (url) => {
  try {
    return await fetchGenericMetadata(url, 'facebook');
  } catch (error) {
    console.error('Error fetching Facebook metadata:', error);
    const validation = validateVideoUrl(url);

    // Mock response for development if API fails
    return {
      title: `Facebook Video (ID: ${validation.videoId})`,
      description: 'Facebook video',
      duration: 180, // 3 minutes
      thumbnail: '',
      platform: 'facebook',
      videoId: validation.videoId,
    };
  }
};

/**
 * Fetches metadata for a Twitter video using youtube-dl
 * @param {string} url - Twitter video URL
 * @returns {Promise<Object>} Video metadata
 */
const fetchTwitterMetadata = async (url) => {
  try {
    return await fetchGenericMetadata(url, 'twitter');
  } catch (error) {
    console.error('Error fetching Twitter metadata:', error);
    const validation = validateVideoUrl(url);

    // Mock response for development if API fails
    return {
      title: `Twitter Video (ID: ${validation.videoId})`,
      description: 'Twitter video',
      duration: 120, // 2 minutes
      thumbnail: '',
      platform: 'twitter',
      videoId: validation.videoId,
    };
  }
};

/**
 * Fallback method to fetch video metadata using youtube-dl
 * @param {string} url - Video URL
 * @param {string} platform - Platform name
 * @returns {Promise<Object>} Video metadata
 */
const fetchGenericMetadata = async (url, platform = 'unknown') => {
  try {
    const options = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    };

    const output = await ytdl(url, options);
    const validation = validateVideoUrl(url);

    return {
      title: output.title || `Video from ${platform}`,
      description: output.description || '',
      duration: output.duration || 0,
      thumbnail: output.thumbnail || output.thumbnails?.[0]?.url || '',
      platform: platform,
      videoId: validation.videoId || output.id,
    };
  } catch (error) {
    console.error(`Error fetching generic metadata for ${platform}:`, error);
    const validation = validateVideoUrl(url);

    // Mock response for development if youtube-dl fails
    return {
      title: `Video from ${platform} (ID: ${validation.videoId})`,
      description: `This is a video from ${platform}`,
      duration: 120, // 2 minutes as default
      thumbnail: '',
      platform: platform,
      videoId: validation.videoId,
    };
  }
};

module.exports = {
  fetchVideoMetadata
};