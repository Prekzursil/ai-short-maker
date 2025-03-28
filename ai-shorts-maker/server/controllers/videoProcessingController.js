const ProcessingJob = require('../models/ProcessingJob');
const { processVideo } = require('../services/videoProcessingService');

/**
 * Endpoint to process a video into short clips
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processVideoController = async (req, res) => {
  try {
    const {
      videos,
      prompt,
      duration,
      initialWhisperModel,
      subtitles,
      originalLanguage,
      burnSubtitles,
      saveSrtSeparately,
      translateSubtitles,
      targetLanguage,
      translateTitle,
      saveOriginalSrt,
      saveTranslatedSrt,
      subtitleWhisperModel,
      subtitleStyle,
      outputFolder
    } = req.body;

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one video is required'
      });
    }

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    if (!duration || !duration.min || !duration.max) {
      return res.status(400).json({
        success: false,
        error: 'Min and max duration are required'
      });
    }

    // Check if min duration is less than max duration
    if (parseInt(duration.min) >= parseInt(duration.max)) {
      return res.status(400).json({
        success: false,
        error: 'Min duration must be less than max duration'
      });
    }

    // Create a processing job for each video
    const jobs = [];

    for (const video of videos) {
      const job = new ProcessingJob({
        userId: req.user._id,
        sourceType: video.type,
        sourceUrl: video.path,
        prompt,
        duration: {
          min: parseInt(duration.min),
          max: parseInt(duration.max)
        },
        outputFolder: outputFolder || '/default/output',
        subtitles: {
          generate: subtitles || true,
          language: originalLanguage || 'auto',
          burn: burnSubtitles || true,
          saveSeparately: saveSrtSeparately || true,
          translate: translateSubtitles || false,
          targetLanguage: targetLanguage || 'en',
          whisperModel: subtitleWhisperModel || initialWhisperModel || 'base',
          style: subtitleStyle || {
            fontSize: 24,
            fontColor: '#FFFFFF',
            highlightColor: '#FF3B30',
            backgroundColor: '#000000',
            opacity: 80
          }
        },
        translateTitle: translateTitle || false,
        saveOriginalSrt: saveOriginalSrt || true,
        saveTranslatedSrt: saveTranslatedSrt || true
      });

      await job.save();
      jobs.push(job);

      // Start processing in the background
      processVideo(job._id).catch(error => {
        console.error(`Background processing error for job ${job._id}:`, error);
      });
    }

    return res.status(201).json({
      success: true,
      message: `Started processing ${jobs.length} video(s)`,
      jobs: jobs.map(job => ({
        id: job._id,
        status: job.status,
        sourceUrl: job.sourceUrl
      }))
    });
  } catch (error) {
    console.error('Error in process video controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process video'
    });
  }
};

/**
 * Endpoint to get the status of a processing job
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProcessingStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    const job = await ProcessingJob.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Processing job not found'
      });
    }

    // Check if the job belongs to the current user
    if (job.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this job'
      });
    }

    return res.json({
      success: true,
      job: {
        id: job._id,
        status: job.status,
        progress: job.status === 'completed' ? 100 :
                 job.status === 'failed' ? 0 :
                 job.status === 'processing' ? Math.floor(Math.random() * 80) + 10 : 0,
        sourceUrl: job.sourceUrl,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        clips: job.clips || [],
        error: job.error
      }
    });
  } catch (error) {
    console.error('Error in get processing status:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get processing status'
    });
  }
};

module.exports = {
  processVideoController,
  getProcessingStatus
};