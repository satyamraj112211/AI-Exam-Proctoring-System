const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  // Exam Settings
  examSettings: {
    defaultDuration: {
      type: Number,
      default: 60, // minutes
      min: 5,
      max: 480
    },
    defaultPassingMarks: {
      type: Number,
      default: 40, // percentage
      min: 0,
      max: 100
    },
    maxExamDuration: {
      type: Number,
      default: 180, // minutes
      min: 10,
      max: 480
    },
    minExamDuration: {
      type: Number,
      default: 15, // minutes
      min: 5,
      max: 60
    },
    autoSubmitOnTabSwitch: {
      type: Boolean,
      default: false
    },
    maxWarningsBeforeSubmit: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    allowTabSwitch: {
      type: Boolean,
      default: true
    },
    detectDevTools: {
      type: Boolean,
      default: true
    }
  },

  // Proctoring Settings
  proctoringSettings: {
    screenSharingEnabled: {
      type: Boolean,
      default: true
    },
    videoProctoringEnabled: {
      type: Boolean,
      default: false
    },
    screenCaptureQuality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    screenCaptureInterval: {
      type: Number,
      default: 250, // milliseconds
      min: 100,
      max: 2000
    },
    antiCheatSensitivity: {
      type: String,
      enum: ['low', 'medium', 'high', 'strict'],
      default: 'medium'
    }
  },

  // Notification Settings
  notificationSettings: {
    emailNotificationsEnabled: {
      type: Boolean,
      default: true
    },
    smsNotificationsEnabled: {
      type: Boolean,
      default: false
    },
    notifyOnExamStart: {
      type: Boolean,
      default: true
    },
    notifyOnExamEnd: {
      type: Boolean,
      default: true
    },
    notifyOnResults: {
      type: Boolean,
      default: true
    }
  },

  // Security Settings
  securitySettings: {
    sessionTimeout: {
      type: Number,
      default: 480, // minutes (8 hours)
      min: 15,
      max: 1440
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    passwordResetExpiry: {
      type: Number,
      default: 24, // hours
      min: 1,
      max: 168
    },
    jwtTokenExpiry: {
      type: String,
      default: '7d', // days
      enum: ['1d', '3d', '7d', '14d', '30d']
    },
    requireEmailVerification: {
      type: Boolean,
      default: true
    }
  },

  // System Settings
  systemSettings: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'System is under maintenance. Please try again later.',
      maxlength: 500
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      maxlength: 50
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY',
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
    },
    timeFormat: {
      type: String,
      default: '24h',
      enum: ['12h', '24h']
    },
    maxFileUploadSize: {
      type: Number,
      default: 5, // MB
      min: 1,
      max: 50
    }
  },

  // Email/SMTP Settings
  emailSettings: {
    smtpHost: {
      type: String,
      default: '',
      maxlength: 255
    },
    smtpPort: {
      type: Number,
      default: 587,
      min: 1,
      max: 65535
    },
    smtpSecure: {
      type: Boolean,
      default: false
    },
    smtpUsername: {
      type: String,
      default: '',
      maxlength: 255
    },
    smtpPassword: {
      type: String,
      default: '',
      select: false // Don't return password by default
    },
    fromEmail: {
      type: String,
      default: '',
      maxlength: 255
    },
    fromName: {
      type: String,
      default: 'VirtualXam',
      maxlength: 100
    }
  },

  // Last updated by
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },

  // Metadata
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Ensure only one configuration document exists
systemConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    // Create default configuration
    config = await this.create({});
  }
  return config;
};

// Index for faster queries
systemConfigSchema.index({ version: 1 });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);

