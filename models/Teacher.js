const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { UNIVERSITY_NAMES } = require('../utils/constants/universities');

const teacherSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      // Relaxed but safe email validation:
      // - must contain exactly one "@"
      // - non-empty local and domain parts
      // - domain must contain at least one dot with non-empty labels
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    teacherId: {
      type: String,
      required: [true, 'Teacher ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{6,12}$/, 'Teacher ID must be 6-12 alphanumeric characters']
    },
    university: {
      type: String,
      required: [true, 'University is required'],
      trim: true,
      minlength: [2, 'University name must be at least 2 characters'],
      maxlength: [120, 'University name cannot exceed 120 characters']
    },
    otherUniversity: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords do not match'
      }
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    verificationOTP: {
      type: String,
      select: false
    },
    otpExpires: {
      type: Date,
      select: false
    },
    profilePhoto: {
      type: String,
      default: 'default-teacher.jpg'
    },
    department: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['teacher', 'head-teacher', 'admin'],
      default: 'teacher'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
teacherSchema.index({ email: 1 });
teacherSchema.index({ teacherId: 1 });
teacherSchema.index({ university: 1 });
teacherSchema.index({ createdAt: -1 });

// Virtual for full name
teacherSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
teacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// Update passwordChangedAt when password is modified
teacherSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance method to check password
teacherSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after token was issued
teacherSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate OTP for email verification
teacherSchema.methods.createVerificationOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationOTP = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return otp;
};

// Verify OTP
teacherSchema.methods.verifyOTP = function(otp) {
  if (this.otpExpires < Date.now()) {
    return { success: false, message: 'OTP has expired' };
  }
  
  if (this.verificationOTP !== otp) {
    return { success: false, message: 'Invalid OTP' };
  }
  
  this.emailVerified = true;
  this.verificationOTP = undefined;
  this.otpExpires = undefined;
  
  return { success: true, message: 'Email verified successfully' };
};

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;