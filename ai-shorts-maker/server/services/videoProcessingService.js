const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const ProcessingJob = require('../models/ProcessingJob');
const os = require('os');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { sendLLMRequest } = require('./llmService');

// Helper function to ensure a directory exists
const ensureDir = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Helper function to download video from URL
const downloadVideo = async (url, outputPath) => {
  console.log(`Downloading video from ${url} to ${outputPath}`);

  const writer = require('fs').createWriteStream(outputPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

// Get video duration using FFmpeg
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

// Extract audio from video using FFmpeg
const extractAudio = async (videoPath, audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec('libmp3lame')
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};

// Analyze video content using Whisper and LLM
const analyzeVideoContent = async (audioPath, prompt, language = 'auto') => {
  try {
    // 1. Transcribe the audio using Whisper (would integrate with actual Whisper API)
    console.log(`Transcribing audio from ${audioPath}`);

    // For a real implementation, call the OpenAI Whisper API
    // This is a simplified mock for now
    const transcriptionCmd = `whisper ${audioPath} --language ${language} --output_format json`;

    // In a real implementation, this would be replaced with actual API call
    // For now, we'll simulate a transcript
    const transcript = "This is a sample transcript of the video. In the first part, the speaker introduces the topic. Then they discuss key points. Finally, they summarize with a conclusion.";

    // 2. Use LLM to analyze the transcript based on the prompt
    const llmPrompt = `
      I have a video with the following transcript:
      "${transcript}"

      Based on this transcript and this prompt: "${prompt}", identify distinct segments that would make good short clips.
      For each segment, provide:
      1. A start time (in seconds)
      2. An end time (in seconds)
      3. A descriptive title
      4. A brief summary of the content

      Format your response as valid JSON with an array of segments.
    `;

    // Call the LLM service to get segment recommendations
    const segments = await sendLLMRequest({
      messages: [{ role: "user", content: llmPrompt }],
      provider: "openai"
    });

    // Parse the response into usable segments
    // (in real implementation, ensure proper JSON handling)
    let parsedSegments;
    try {
      // For demo, we'll create mock segments
      parsedSegments = [
        {
          start: 0,
          end: 35,
          title: "Introduction to the Topic",
          summary: "Speaker introduces the main concepts"
        },
        {
          start: 36,
          end: 92,
          title: "Key Points Discussion",
          summary: "Detailed explanation of important aspects"
        },
        {
          start: 93,
          end: 120,
          title: "Summary and Conclusion",
          summary: "Final thoughts and takeaways"
        }
      ];
    } catch (error) {
      console.error("Error parsing LLM response:", error);
      // Fallback to basic segmentation
      parsedSegments = [
        { start: 0, end: 30, title: "Part 1", summary: "Beginning section" },
        { start: 31, end: 60, title: "Part 2", summary: "Middle section" },
        { start: 61, end: 90, title: "Part 3", summary: "End section" }
      ];
    }

    return parsedSegments;
  } catch (error) {
    console.error("Error analyzing video content:", error);
    throw error;
  }
};

// Create clips from video using FFmpeg
const createClip = async (videoPath, outputPath, start, end) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .setStartTime(start)
      .setDuration(end - start)
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};

// Generate subtitles using Whisper
const generateSubtitles = async (videoPath, outputPath, language = 'auto', model = 'base') => {
  try {
    // Extract audio first
    const audioPath = videoPath.replace(/\.[^/.]+$/, ".mp3");
    await extractAudio(videoPath, audioPath);

    // Use Whisper to generate subtitles
    // In a real implementation, call the actual Whisper API
    console.log(`Generating subtitles for ${videoPath} in ${language} using ${model} model`);

    // For a real implementation, this would be an API call
    const subtitleCmd = `whisper ${audioPath} --language ${language} --model ${model} --output_format srt --output_file ${outputPath}`;

    // For demo, create a simple SRT file
    const srtContent = `1
00:00:00,000 --> 00:00:05,000
This is a sample subtitle

2
00:00:05,500 --> 00:00:10,000
Generated for demonstration purposes

3
00:00:10,500 --> 00:00:15,000
In a real implementation, these would be accurate`;

    await fs.writeFile(outputPath, srtContent);

    // Clean up the audio file
    try {
      await fs.unlink(audioPath);
    } catch (err) {
      console.warn(`Warning: Could not delete temporary audio file ${audioPath}`);
    }

    return outputPath;
  } catch (error) {
    console.error("Error generating subtitles:", error);
    throw error;
  }
};

// Translate subtitles
const translateSubtitles = async (srtPath, outputPath, targetLanguage) => {
  try {
    // Read the original SRT file
    const srtContent = await fs.readFile(srtPath, 'utf8');

    // In a real implementation, use a translation API
    console.log(`Translating subtitles from ${srtPath} to ${targetLanguage}`);

    // For demo, we'll create a "translated" version
    const translatedContent = srtContent.replace(
      /This is a sample subtitle/g,
      targetLanguage === 'es' ? "Este es un subtítulo de muestra" : "This is a translated subtitle"
    );

    await fs.writeFile(outputPath, translatedContent);

    return outputPath;
  } catch (error) {
    console.error("Error translating subtitles:", error);
    throw error;
  }
};

// Burn subtitles into a video
const burnSubtitles = async (videoPath, subtitlePath, outputPath, style) => {
  return new Promise((resolve, reject) => {
    // Configure subtitle styling
    const fontSize = style.fontSize || 24;
    const fontColor = style.fontColor || 'white';
    const bgColor = style.backgroundColor || 'black';
    const opacity = (style.opacity || 80) / 100;

    ffmpeg(videoPath)
      .input(subtitlePath)
      .complexFilter([
        `subtitles=${subtitlePath}:force_style='FontSize=${fontSize},PrimaryColour=${fontColor},BackColour=${bgColor},Outline=1,Shadow=1,Alignment=2'`
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};

/**
 * Process a video and break it into short clips
 *
 * @param {string} jobId - The ID of the processing job
 * @returns {Promise<Object>} - Updated job object
 */
const processVideo = async (jobId) => {
  try {
    // Get job details
    const job = await ProcessingJob.findById(jobId);
    if (!job) {
      throw new Error('Processing job not found');
    }

    // Update job status to processing
    job.status = 'processing';
    await job.save();

    console.log(`Starting processing for job ${jobId}`);

    // Create temporary work directory
    const workDir = path.join(os.tmpdir(), `shorts-maker-${jobId}`);
    await ensureDir(workDir);

    // Create output directories
    const outputDir = path.join(workDir, 'output');
    const subtitleDir = path.join(workDir, 'subtitles');
    await ensureDir(outputDir);
    await ensureDir(subtitleDir);

    // 1. Get the source video
    const videoPath = path.join(workDir, 'source.mp4');
    if (job.sourceType === 'url') {
      // Download the video if it's a URL
      await downloadVideo(job.sourceUrl, videoPath);
    } else {
      // For local files, we'd need to handle file copying/moving
      // In a real implementation, the frontend would upload the file
      // For now, we'll assume the path is accessible
      try {
        await fs.copyFile(job.sourceUrl, videoPath);
      } catch (error) {
        throw new Error(`Could not access local file: ${error.message}`);
      }
    }

    // 2. Extract audio for analysis
    const audioPath = path.join(workDir, 'audio.mp3');
    await extractAudio(videoPath, audioPath);

    // 3. Analyze the video to identify segments
    const segments = await analyzeVideoContent(
      audioPath,
      job.prompt,
      job.subtitles.language
    );

    // 4. Create clips based on the segments
    const clips = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const clipIndex = i + 1;
      const clipTitle = segment.title;

      // Ensure the clip is within the desired duration range
      let clipStart = segment.start;
      let clipEnd = segment.end;
      let clipDuration = clipEnd - clipStart;

      if (clipDuration < job.duration.min) {
        // Clip is too short, adjust if possible
        clipEnd = Math.min(
          clipStart + job.duration.min,
          await getVideoDuration(videoPath)
        );
        clipDuration = clipEnd - clipStart;
      }

      if (clipDuration > job.duration.max) {
        // Clip is too long, trim it
        clipEnd = clipStart + job.duration.max;
        clipDuration = clipEnd - clipStart;
      }

      // Create the clip
      const clipFileName = `clip_${clipIndex}.mp4`;
      const clipPath = path.join(outputDir, clipFileName);

      await createClip(videoPath, clipPath, clipStart, clipEnd);

      // Generate subtitles if requested
      let subtitlePath = null;
      let translatedSubtitlePath = null;

      if (job.subtitles.generate) {
        const srtFileName = `clip_${clipIndex}.srt`;
        subtitlePath = path.join(subtitleDir, srtFileName);

        await generateSubtitles(
          clipPath,
          subtitlePath,
          job.subtitles.language,
          job.subtitles.whisperModel
        );

        // Translate subtitles if requested
        if (job.subtitles.translate) {
          const translatedSrtFileName = `clip_${clipIndex}_${job.subtitles.targetLanguage}.srt`;
          translatedSubtitlePath = path.join(subtitleDir, translatedSrtFileName);

          await translateSubtitles(
            subtitlePath,
            translatedSubtitlePath,
            job.subtitles.targetLanguage
          );
        }

        // Burn subtitles into video if requested
        if (job.subtitles.burn) {
          const srtToUse = job.subtitles.translate ? translatedSubtitlePath : subtitlePath;
          const burnedClipPath = path.join(outputDir, `clip_${clipIndex}_subtitled.mp4`);

          await burnSubtitles(
            clipPath,
            srtToUse,
            burnedClipPath,
            job.subtitles.style
          );

          // Replace the original clip with the subtitled version
          await fs.unlink(clipPath);
          await fs.rename(burnedClipPath, clipPath);
        }
      }

      // Add clip to the results
      clips.push({
        title: clipTitle,
        path: `/processed/${jobId}/clips/${clipFileName}`,
        start: clipStart,
        end: clipEnd,
        duration: clipDuration,
        subtitlePath: subtitlePath ? `/processed/${jobId}/subtitles/${path.basename(subtitlePath)}` : null,
        translatedSubtitlePath: translatedSubtitlePath ?
          `/processed/${jobId}/subtitles/${path.basename(translatedSubtitlePath)}` : null
      });
    }

    // 5. Update job with results
    job.status = 'completed';
    job.clips = clips;
    await job.save();

    console.log(`Completed processing for job ${jobId} with ${clips.length} clips`);

    // 6. Clean up temporary files
    // In a production environment, you'd move files to permanent storage
    // For this demo, we'll keep them in the temp directory

    return job;
  } catch (error) {
    console.error(`Error processing video for job ${jobId}:`, error);

    // Update job with error
    const job = await ProcessingJob.findById(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      await job.save();
    }

    throw error;
  }
};

/**
 * Generate a title for a clip based on the prompt and clip number
 *
 * @param {string} prompt - The user's processing prompt
 * @param {number} index - The clip index
 * @returns {string} - Generated title
 */
const generateClipTitle = (prompt, index) => {
  // In a real implementation, this would use AI to analyze the content
  // and generate a relevant title. For now, we'll use a mock.
  const mockTitles = [
    'Introduction and Overview',
    'Key Market Insights',
    'Strategic Planning Process',
    'Competitive Analysis Results',
    'Future Growth Opportunities',
    'Customer Feedback Summary',
    'Implementation Timeline',
    'Budget Considerations',
    'Technical Deep Dive',
    'Q&A Session Highlights'
  ];

  return mockTitles[index % mockTitles.length];
};

/**
 * Get the status of a processing job
 *
 * @param {string} jobId - The ID of the processing job
 * @returns {Promise<Object>} - Job status information
 */
const getProcessingStatus = async (jobId) => {
  const job = await ProcessingJob.findById(jobId);
  if (!job) {
    throw new Error('Processing job not found');
  }

  return {
    id: job._id,
    status: job.status,
    progress: job.status === 'completed' ? 100 :
             job.status === 'failed' ? 0 :
             job.status === 'processing' ? Math.floor(Math.random() * 80) + 10 : 0,
    clips: job.clips,
    error: job.error,
    sourceUrl: job.sourceUrl,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
};

module.exports = {
  processVideo,
  getProcessingStatus
};