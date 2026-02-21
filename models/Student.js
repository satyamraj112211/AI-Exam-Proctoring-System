const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  mobileNumber: {
    type: String,
    trim: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  institutionType: {
    type: String,
    enum: ['university', 'college'],
    required: true,
  },
  institution: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
    },
    name: { type: String, required: true },
    code: { type: String, required: true },
  },
  branch: {
    code: { type: String, required: true, uppercase: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['tech', 'non-tech'], default: 'tech' },
  },
  batchYear: {
    type: Number,
    required: true,
    min: 1900,
    max: 2100,
  },
  currentYear: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  section: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  otpAttempts: {
    type: Number,
    default: 0,
  },
  lastOtpAttempt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  profileImage: {
    type: String, // URL or relative path to profile image
  },
});

studentSchema.index(
  {
    'institution.id': 1,
    'branch.code': 1,
    batchYear: 1,
    currentYear: 1,
    section: 1,
  },
  { name: 'institution_branch_year_section_idx' },
);

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update updatedAt timestamp
studentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);