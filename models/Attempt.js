const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedAnswer: {
      type: String,
      default: null
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    marksObtained: {
      type: Number,
      default: 0
    }
  }],
  totalMarks: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'submitted', 'graded'],
    default: 'in_progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: {
    type: Date
  },
  timeSpent: {
    type: Number, // Time spent in seconds
    default: 0
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
attemptSchema.index({ student: 1, test: 1 });
attemptSchema.index({ student: 1, status: 1 });
attemptSchema.index({ test: 1, status: 1 });
attemptSchema.index({ submittedAt: -1 });

// Prevent duplicate attempts (one student can only attempt a test once)
attemptSchema.index({ student: 1, test: 1 }, { unique: true });

module.exports = mongoose.model('Attempt', attemptSchema);
























