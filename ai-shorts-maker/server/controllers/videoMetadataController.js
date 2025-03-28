const { fetchVideoMetadata } = require('../services/videoMetadataService');

/**
 * Retrieves metadata for a video URL from supported platforms
 * @param {Object} req - Express request object with url in body
 * @param {Object} res - Express response object
 */
const getVideoMetadata = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      console.log('Metadata fetch failed: URL is required');
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    console.log(`Fetching metadata for video URL: ${url}`);
    const metadata = await fetchVideoMetadata(url);

    console.log(`Successfully fetched metadata for: ${metadata.title}`);
    return res.json({
      success: true,
      metadata
    });
  } catch (error) {
    console.error('Error in getVideoMetadata controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch video metadata'
    });
  }
};

module.exports = {
  getVideoMetadata
};