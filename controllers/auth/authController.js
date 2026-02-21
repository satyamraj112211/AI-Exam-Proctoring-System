const Student = require('../../models/Student.js');
const Institution = require('../../models/Institution.js');
const OTPService = require('../../services/otpService.js');
const EmailService = require('../../services/emailService.js');
const asyncHandler = require('../../utils/helpers/asyncHandler.js');
const ApiResponse = require('../../utils/helpers/apiResponse.js');
const jwt = require('jsonwebtoken');
const { validateEmail } = require('../../utils/helpers/validators.js');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Send OTP for student registration
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email || !validateEmail(email)) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Please provide a valid email address')
    );
  }

  // Generate and save OTP
  const otp = await OTPService.createOTP(email, 'signup');

  // Try to send email immediately (with fast timeout for cloud)
  // If it fails quickly, queue it for background retry
  const emailQueue = require('../../services/emailQueue');
  
  let emailSent = false;
  
  try {
    // Try immediate send with 10 second timeout (fast response)
    emailSent = await Promise.race([
      EmailService.sendOTP(email, otp),
      new Promise((resolve) => setTimeout(() => resolve(false), 10000)) // 10 second timeout
    ]);

    if (emailSent) {
      res.status(200).json(
        new ApiResponse(200, { email }, 'OTP sent successfully. Please check your email.')
      );
      return;
    }
  } catch (error) {
    console.warn('Immediate email send failed, queuing for retry:', error.message);
  }

  // If immediate send failed or timed out, queue for background processing
  if (!emailSent) {
    emailQueue.enqueue({
      email,
      otp,
      sendFunction: async () => {
        return await EmailService.sendOTP(email, otp);
      }
    });

    // Return success immediately - email will be sent in background
    res.status(200).json(
      new ApiResponse(200, { email }, 'OTP sent successfully. Please check your email.')
    );
  }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Email and OTP are required')
    );
  }

  // Verify OTP
  await OTPService.verifyOTP(email, otp, 'signup');

  // Cleanup old OTPs
  await OTPService.cleanupOTPs(email);

  // Create temporary session token
  const tempToken = jwt.sign(
    { email, step: 'otp_verified' },
    process.env.JWT_SECRET,
    { expiresIn: '30m' }
  );

  res.status(200).json(
    new ApiResponse(200, { 
      email, 
      token: tempToken,
      step: 'registration'
    }, 'OTP verified successfully')
  );
});

// @desc    Get institutions list (universities/colleges) with branches metadata
// @route   GET /api/auth/universities
// @access  Public
exports.getUniversities = asyncHandler(async (req, res) => {
  const institutions = await Institution.find({ status: 'active' }).select(
    'name code type branches',
  );

  const formatted = institutions.map((inst) => ({
    id: inst._id,
    name: inst.name,
    code: inst.code,
    type: inst.type,
    branches: inst.branches.map((b) => ({
      code: b.code,
      name: b.name,
      category: b.category,
      years: b.years.map((y) => ({
        label: y.label,
        sections: y.sections.map((s) => s.name),
      })),
    })),
  }));

  res
    .status(200)
    .json(new ApiResponse(200, formatted, 'Institutions fetched successfully'));
});

// @desc    Complete student registration
// @route   POST /api/auth/register
// @access  Public
exports.registerStudent = asyncHandler(async (req, res) => {
  const {
    email,
    firstName,
    lastName,
    institutionId,
    institutionType,
    branchCode,
    batchYear,
    currentYear,
    section,
    password,
    confirmPassword
  } = req.body;

  // Validate required fields
  if (
    !email ||
    !firstName ||
    !lastName ||
    !institutionId ||
    !institutionType ||
    !branchCode ||
    !batchYear ||
    !currentYear ||
    !section ||
    !password
  ) {
    return res.status(400).json(
      new ApiResponse(400, null, 'All fields are required')
    );
  }

  // Validate email
  if (!validateEmail(email)) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Invalid email address')
    );
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Passwords do not match')
    );
  }

  // Verify institution and branch
  const institution = await Institution.findById(institutionId);
  if (!institution) {
    return res.status(404).json(new ApiResponse(404, null, 'Institution not found'));
  }

  if (institution.type !== institutionType) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Institution type does not match selected institution'));
  }

  const normalizedBranch = branchCode.trim().toUpperCase();
  const branch = institution.branches.find(
    (b) => b.code.toUpperCase() === normalizedBranch && b.isActive !== false,
  );

  if (!branch) {
    return res.status(404).json(new ApiResponse(404, null, 'Branch not available for this institution'));
  }

  if (institution.type === 'college' && branch.category !== 'tech') {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Selected branch is not allowed for colleges'));
  }

  const yearLabel = String(batchYear);
  const yearEntry =
    branch.years.find((y) => y.label === yearLabel) ||
    branch.years.find((y) => y.label === String(currentYear));

  // Allow dynamic sections when not preconfigured
  const normalizedSection = section.trim().toUpperCase();
  const sectionEntry = yearEntry?.sections?.find(
    (s) => s.name.toUpperCase() === normalizedSection,
  );

  const dynamicSectionPattern = new RegExp(
    `^${yearLabel || currentYear}${normalizedBranch}[1-9]\\d?$`,
  ); // e.g., 2023CSE1..2023CSE30

  const sectionAllowed =
    !!sectionEntry ||
    dynamicSectionPattern.test(normalizedSection);

  if (!sectionAllowed) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Section not configured or allowed for this year/branch'));
  }

  // Check if student already exists
  const existingStudent = await Student.findOne({
    $or: [{ email }],
  });

  if (existingStudent) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Student already registered')
    );
  }

  // Create student
  const student = await Student.create({
    email,
    firstName,
    lastName,
    institutionType,
    institution: {
      id: institution._id,
      name: institution.name,
      code: institution.code,
    },
    branch: {
      code: branch.code,
      name: branch.name,
      category: branch.category,
    },
    batchYear,
    currentYear,
    section: section.trim().toUpperCase(),
    password,
    isEmailVerified: true,
  });

  // Generate JWT token
  const token = generateToken(student._id);

  // Send welcome email
  await EmailService.sendWelcomeEmail(email, firstName);

  res.status(201).json(
    new ApiResponse(201, {
      student: {
        id: student._id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        institution: student.institution,
        institutionType: student.institutionType,
        branch: student.branch,
        batchYear: student.batchYear,
        currentYear: student.currentYear,
        section: student.section,
      },
      token,
    }, 'Registration successful')
  );
});

// @desc    Login student
// @route   POST /api/auth/login
// @access  Public
exports.loginStudent = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Please provide email and password')
    );
  }

  // Check if student exists
  const student = await Student.findOne({ email }).select('+password');

  if (!student) {
    return res.status(401).json(
      new ApiResponse(401, null, 'Invalid credentials')
    );
  }

  // Check if email is verified
  if (!student.isEmailVerified) {
    return res.status(401).json(
      new ApiResponse(401, null, 'Please verify your email first')
    );
  }

  // Check password
  const isPasswordCorrect = await student.comparePassword(password);

  if (!isPasswordCorrect) {
    return res.status(401).json(
      new ApiResponse(401, null, 'Invalid credentials')
    );
  }

  // Generate token
  const token = generateToken(student._id);

  res.status(200).json(
    new ApiResponse(200, {
      student: {
        id: student._id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        institution: student.institution,
        institutionType: student.institutionType,
        branch: student.branch,
        batchYear: student.batchYear,
        currentYear: student.currentYear,
        section: student.section,
      },
      token,
    }, 'Login successful')
  );
});

// @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Please provide a valid email address')
    );
  }

  // Check if student exists
  const student = await Student.findOne({ email });

  if (!student) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Email not registered. Please sign up first.')
    );
  }

  // Generate and save OTP for password reset
  const otp = await OTPService.createOTP(email, 'reset');

  // Send OTP via email
  const emailSent = await EmailService.sendOTP(email, otp);

  if (!emailSent) {
    return res.status(500).json(
      new ApiResponse(500, null, 'Failed to send OTP email')
    );
  }

  res.status(200).json(
    new ApiResponse(200, { email }, 'OTP sent successfully to your email')
  );
});

// @desc    Verify OTP for password reset
// @route   POST /api/auth/verify-reset-otp
// @access  Public
exports.verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Email and OTP are required')
    );
  }

  // Verify OTP
  await OTPService.verifyOTP(email, otp, 'reset');

  // Create temporary token for password reset
  const resetToken = jwt.sign(
    { email, type: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.status(200).json(
    new ApiResponse(200, { 
      email,
      resetToken,
      message: 'OTP verified successfully'
    }, 'OTP verified successfully')
  );
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, password, confirmPassword } = req.body;

  if (!resetToken || !password || !confirmPassword) {
    return res.status(400).json(
      new ApiResponse(400, null, 'All fields are required')
    );
  }

  if (password !== confirmPassword) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Passwords do not match')
    );
  }

  // Verify reset token
  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }
  } catch (error) {
    return res.status(401).json(
      new ApiResponse(401, null, 'Invalid or expired reset token')
    );
  }

  // Find student
  const student = await Student.findOne({ email: decoded.email });

  if (!student) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Student not found')
    );
  }

  // Update password
  student.password = password;
  await student.save();

  // Cleanup OTPs
  await OTPService.cleanupOTPs(decoded.email);

  res.status(200).json(
    new ApiResponse(200, null, 'Password reset successfully')
  );
});
