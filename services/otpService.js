const crypto = require('crypto');
const OTP = require('../models/OTP');
const Student = require('../models/Student');

class OTPService {
  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  static async createOTP(email, type = 'signup') {
    // For signup, check if student already exists
    if (type === 'signup') {
      const existingStudent = await Student.findOne({ email });
      if (existingStudent && existingStudent.isEmailVerified) {
        throw new Error('Email already registered');
      }
    }

    // Check OTP attempts
    const otpAttempts = await OTP.countDocuments({ 
      email, 
      type,
      createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) } 
    });

    if (otpAttempts >= (process.env.OTP_MAX_ATTEMPTS || 5)) {
      throw new Error('Too many OTP attempts. Please try again later.');
    }

    // Generate OTP
    const otpCode = this.generateOTP(process.env.OTP_LENGTH || 6);
    const expiresAt = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);

    // Save OTP
    const otp = new OTP({
      email,
      otp: otpCode,
      type,
      expiresAt,
    });

    await otp.save();
    return otpCode;
  }

  static async verifyOTP(email, otpCode, type = 'signup') {
    const otp = await OTP.findOne({
      email,
      otp: otpCode,
      type,
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!otp) {
      // Increment attempts
      await OTP.updateOne(
        { email, type },
        { $inc: { attempts: 1 } }
      );
      throw new Error('Invalid or expired OTP');
    }

    // Mark OTP as verified
    otp.verified = true;
    await otp.save();

    return true;
  }

  static async cleanupOTPs(email) {
    await OTP.deleteMany({ email });
  }
}

module.exports = OTPService;