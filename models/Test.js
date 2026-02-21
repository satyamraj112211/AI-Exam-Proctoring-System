const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  testType: {
    type: String,
    enum: ['mcq', 'coding', 'hybrid'],
    default: 'mcq',
    trim: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  windowCloseDate: {
    type: Date,
    // Optional - if not provided, calculated as scheduledDate + duration
  },
  duration: {
    type: Number, // Duration in minutes
    required: true,
    min: 1
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 100
  },
  passingMarks: {
    type: Number,
    default: 40
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  instructions: {
    type: String,
    trim: true
  },
  allowedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
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
testSchema.index({ teacher: 1, scheduledDate: 1 });
testSchema.index({ status: 1, scheduledDate: 1 });
testSchema.index({ course: 1 });

module.exports = mongoose.model('Test', testSchema);









