const { validateVideoUrl } = require('../services/videoService');

/**
 * Validates if a URL is a valid video from supported platforms
 * @param {Object} req - Express request object with url in body
 * @param {Object} res - Express response object
 */
const validateUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      console.log('URL validation failed: URL is required');
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    console.log(`Validating video URL: ${url}`);
    const validationResult = validateVideoUrl(url);

    if (validationResult.isValid) {
      console.log(`URL validated successfully as ${validationResult.platform} video with ID: ${validationResult.videoId}`);
    } else {
      console.log(`URL validation failed: Not a valid video URL`);
    }

    return res.json({
      success: true,
      ...validationResult
    });
  } catch (error) {
    console.error('Error in validateUrl controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to validate URL'
    });
  }
};

module.exports = {
  validateUrl
};