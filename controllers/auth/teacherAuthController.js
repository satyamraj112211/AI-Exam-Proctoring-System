const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Teacher = require('../../models/Teacher');
const EmailService = require('../../services/emailService');
const logger = require('../../utils/helpers/logger');
const ApiResponse = require('../../utils/helpers/apiResponse');

const sendApiSuccess = (res, statusCode, data, message = 'Success') =>
  res.status(statusCode).json(new ApiResponse(statusCode, data, message));

const sendApiError = (res, statusCode, message) =>
  res.status(statusCode).json(new ApiResponse(statusCode, null, message));

class TeacherAuthController {
  // Generate JWT Token
  signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  };

  // Create and send token
  createSendToken = (teacher, statusCode, res) => {
    const token = this.signToken(teacher._id);

    // Remove password from output
    teacher.password = undefined;

    // Optionally set an HTTP-only cookie when configuration is valid.
    // For SPA + localStorage auth this cookie is not strictly required,
    // so we guard against misconfigured env values instead of throwing.
    const daysRaw = Number(process.env.JWT_COOKIE_EXPIRES_IN);
    if (Number.isFinite(daysRaw) && daysRaw > 0) {
      const cookieOptions = {
        expires: new Date(
          Date.now() + daysRaw * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      };

      try {
        res.cookie('jwt', token, cookieOptions);
      } catch (cookieErr) {
        logger.error('Failed to set teacher auth cookie, continuing without cookie:', cookieErr);
      }
    }

    sendApiSuccess(
      res,
      statusCode,
      {
        token,
        teacher
      },
      'Success'
    );
  };

  // Step 1: Send OTP to email
  sendOTP = async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return sendApiError(res, 400, 'Email is required');
      }
      
      // Normalize email for consistent lookups
      const normalizedEmail = email.trim().toLowerCase();

      // Check if teacher already exists
      const existingTeacher = await Teacher.findOne({ email: normalizedEmail });
      if (existingTeacher) {
        return sendApiError(res, 409, 'Teacher with this email already exists');
      }
      
      // Create temporary teacher document for OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      // Store OTP in session or temporary storage (in production, use Redis)
      req.session.teacherOTP = {
        email: normalizedEmail,
        otp,
        otpExpires
      };
      
      // Send OTP email
      try {
        const sent = await EmailService.sendOTP(email, otp);

        if (!sent) {
          // In development environments, we do not want email configuration
          // issues to block teacher signup flows. Log the error and still
          // report success so the UI can proceed with OTP verification.
          logger.warn(`Failed to send teacher OTP email to ${email}, but continuing for dev.`);
        } else {
          logger.info(`OTP sent to teacher email: ${email}`);
        }

        sendApiSuccess(res, 200, {
          email,
          expiresIn: '10 minutes'
        }, 'OTP sent successfully');
      } catch (emailError) {
        logger.error('Failed to send OTP email:', emailError);
        // Same approach as above: do not block signup on mail transport errors.
        sendApiSuccess(res, 200, {
          email,
          expiresIn: '10 minutes',
        }, 'OTP generated successfully');
      }
    } catch (error) {
      logger.error('Error in sendOTP:', error);
      sendApiError(res, 500, 'Server error');
    }
  };

  // Step 2: Verify OTP
  verifyOTP = async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return sendApiError(res, 400, 'Email and OTP are required');
      }
      
      // Verify OTP from session
      const normalizedEmail = email.trim().toLowerCase();

      if (!req.session.teacherOTP || 
          req.session.teacherOTP.email !== normalizedEmail || 
          req.session.teacherOTP.otp !== otp ||
          req.session.teacherOTP.otpExpires < Date.now()) {
        return sendApiError(res, 400, 'Invalid or expired OTP');
      }
      
      // Mark email as verified in session
      req.session.teacherOTP.verified = true;
      req.session.teacherOTP.verificationTime = Date.now();
      
      logger.info(`OTP verified for teacher email: ${email}`);
      
      sendApiSuccess(
        res,
        200,
        {
          email,
          verified: true,
          nextStep: 'registration'
        },
        'OTP verified successfully'
      );
    } catch (error) {
      logger.error('Error in verifyOTP:', error);
      sendApiError(res, 500, 'Server error');
    }
  };

  // Step 3: Complete registration
  register = async (req, res, next) => {
    try {
      // Check if OTP was verified
      if (!req.session.teacherOTP || !req.session.teacherOTP.verified) {
        return sendApiError(res, 400, 'Please verify your email first');
      }
      
      const { 
        firstName, 
        lastName, 
        teacherId, 
        university, 
        otherUniversity,
        password, 
        passwordConfirm 
      } = req.body;
      
      const email = req.session.teacherOTP.email;
      
      // Validation
      if (!firstName || !lastName || !teacherId || !university || !password || !passwordConfirm) {
        return sendApiError(res, 400, 'All fields are required');
      }
      
      if (password !== passwordConfirm) {
        return sendApiError(res, 400, 'Passwords do not match');
      }
      
      // Check if teacher ID already exists
      const existingTeacherId = await Teacher.findOne({ teacherId });
      if (existingTeacherId) {
        return sendApiError(res, 409, 'Teacher ID already exists');
      }
      
      // Create teacher
      const teacherData = {
        email,
        firstName,
        lastName,
        teacherId,
        university,
        password,
        passwordConfirm,
        emailVerified: true
      };
      
      // Add otherUniversity if university is 'Other'
      if (university === 'Other' && otherUniversity) {
        teacherData.otherUniversity = otherUniversity;
      }
      
      const newTeacher = await Teacher.create(teacherData);
      
      // Clear session
      delete req.session.teacherOTP;
      
      // Generate token
      const token = this.signToken(newTeacher._id);
      
      // Send welcome email
      try {
        await EmailService.sendWelcomeEmail(newTeacher.email, `${newTeacher.firstName} ${newTeacher.lastName}`);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }
      
      logger.info(`Teacher registered: ${newTeacher.email} (${newTeacher.teacherId})`);
      
      sendApiSuccess(
        res,
        201,
        {
          token,
          teacher: {
            id: newTeacher._id,
            email: newTeacher.email,
            firstName: newTeacher.firstName,
            lastName: newTeacher.lastName,
            teacherId: newTeacher.teacherId,
            university: newTeacher.university
          },
          redirect: '/teacher/dashboard',
          redirectCountdown: 5
        },
        'Registration successful! Redirecting to home page...'
      );
    } catch (error) {
      logger.error('Error in teacher registration:', error);
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return sendApiError(res, 409, `${field} already exists`);
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return sendApiError(res, 400, errors.join(', '));
      }
      
      sendApiError(res, 500, 'Registration failed');
    }
  };

  // Login
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return sendApiError(res, 400, 'Please provide email and password');
      }
      
      // Normalize email and find teacher in a case-insensitive way,
      // then select password for comparison.
      const normalizedEmail = email.trim().toLowerCase();
      const teacher = await Teacher.findOne({ email: normalizedEmail }).select('+password');

      if (!teacher) {
        // Email format may be fine, but there is no account for this address.
        return sendApiError(res, 404, 'Email not registered. Please sign up first.');
      }

      const passwordOk = await teacher.correctPassword(password, teacher.password);
      if (!passwordOk) {
        return sendApiError(res, 401, 'Incorrect email or password');
      }
      
      if (!teacher.isActive) {
        return sendApiError(res, 401, 'Your account has been deactivated');
      }
      
      // Update last login
      teacher.lastLogin = Date.now();
      await teacher.save({ validateBeforeSave: false });
      
      this.createSendToken(teacher, 200, res);
    } catch (error) {
      logger.error('Error in teacher login:', error);
      ApiResponse.error(res, 'Login failed', 500);
    }
  };

  // Forgot password - Send OTP
  forgotPassword = async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return sendApiError(res, 400, 'Email is required');
      }
      
      // Check if teacher exists
      const teacher = await Teacher.findOne({ email });
      
      if (!teacher) {
        return sendApiError(res, 404, 'Email not registered. Please sign up first.');
      }
      
      // Generate and save OTP for password reset
      const OTPService = require('../../services/otpService');
      const otp = await OTPService.createOTP(email, 'reset');
      
      // Send OTP via email
      const emailSent = await EmailService.sendPasswordResetOTP(email, otp, 'teacher');
      
      if (!emailSent) {
        return sendApiError(res, 500, 'Failed to send OTP email');
      }
      
      logger.info(`Password reset OTP sent to teacher email: ${email}`);
      
      sendApiSuccess(res, 200, { email }, 'OTP sent successfully to your email');
    } catch (error) {
      logger.error('Error in forgot password:', error);
      if (error.message.includes('Too many')) {
        return sendApiError(res, 429, error.message);
      }
      sendApiError(res, 500, 'Server error');
    }
  };

  // Verify OTP for password reset
  verifyResetOTP = async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return sendApiError(res, 400, 'Email and OTP are required');
      }
      
      // Verify OTP
      const OTPService = require('../../services/otpService');
      await OTPService.verifyOTP(email, otp, 'reset');
      
      // Create temporary token for password reset
      const resetToken = jwt.sign(
        { email, type: 'password_reset', role: 'teacher' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      
      sendApiSuccess(res, 200, { 
        email,
        resetToken,
        message: 'OTP verified successfully'
      }, 'OTP verified successfully');
    } catch (error) {
      logger.error('Error in verify reset OTP:', error);
      sendApiError(res, 400, error.message || 'Invalid or expired OTP');
    }
  };

  // Reset password
  resetPassword = async (req, res, next) => {
    try {
      const { resetToken, password, passwordConfirm } = req.body;
      
      if (!resetToken || !password || !passwordConfirm) {
        return sendApiError(res, 400, 'All fields are required');
      }
      
      if (password !== passwordConfirm) {
        return sendApiError(res, 400, 'Passwords do not match');
      }
      
      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.type !== 'password_reset' || decoded.role !== 'teacher') {
          throw new Error('Invalid token type');
        }
      } catch (error) {
        return sendApiError(res, 401, 'Invalid or expired reset token');
      }
      
      // Find teacher
      const teacher = await Teacher.findOne({ email: decoded.email });
      
      if (!teacher) {
        return sendApiError(res, 404, 'Teacher not found');
      }
      
      // Update password
      teacher.password = password;
      teacher.passwordConfirm = passwordConfirm;
      teacher.passwordChangedAt = Date.now();
      
      await teacher.save();
      
      // Cleanup OTPs
      const OTPService = require('../../services/otpService');
      await OTPService.cleanupOTPs(decoded.email);
      
      sendApiSuccess(res, 200, null, 'Password reset successfully');
    } catch (error) {
      logger.error('Error in reset password:', error);
      sendApiError(res, 500, 'Server error');
    }
  };
}

module.exports = new TeacherAuthController();