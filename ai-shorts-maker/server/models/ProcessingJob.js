const mongoose = require('mongoose');

const processingJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sourceType: {
    type: String,
    enum: ['local', 'url'],
    required: true
  },
  sourceUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  prompt: {
    type: String,
    required: true
  },
  duration: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    }
  },
  outputFolder: {
    type: String,
    required: true
  },
  subtitles: {
    generate: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'auto'
    },
    burn: {
      type: Boolean,
      default: true
    },
    saveSeparately: {
      type: Boolean,
      default: true
    },
    translate: {
      type: Boolean,
      default: false
    },
    targetLanguage: {
      type: String,
      default: 'en'
    },
    whisperModel: {
      type: String,
      default: 'base'
    },
    style: {
      fontSize: {
        type: Number,
        default: 24
      },
      fontColor: {
        type: String,
        default: '#FFFFFF'
      },
      highlightColor: {
        type: String,
        default: '#FF3B30'
      },
      backgroundColor: {
        type: String,
        default: '#000000'
      },
      opacity: {
        type: Number,
        default: 80
      }
    }
  },
  translateTitle: {
    type: Boolean,
    default: false
  },
  saveOriginalSrt: {
    type: Boolean,
    default: true
  },
  saveTranslatedSrt: {
    type: Boolean,
    default: true
  },
  clips: [{
    title: String,
    path: String,
    start: Number,
    end: Number,
    duration: Number,
    subtitlePath: String,
    translatedSubtitlePath: String
  }],
  error: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
processingJobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ProcessingJob = mongoose.model('ProcessingJob', processingJobSchema);

module.exports = ProcessingJob;