const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['general', 'exam', 'system', 'course'],
    default: 'general'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'teachers'],
    default: 'all'
  },
  targetType: {
    type: String,
    enum: ['all', 'specific'],
    default: 'all'
  },
  targetStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  targetTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  readByStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  readByTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
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

// Indexes
announcementSchema.index({ isActive: 1, createdAt: -1 });
announcementSchema.index({ targetAudience: 1, isActive: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);

















