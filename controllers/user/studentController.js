const Student = require('../../models/Student');
const ApiResponse = require('../../utils/helpers/apiResponse');
const { recordFileUploadAndBuildPath } = require('../../services/storage/fileStorageService');

// GET /api/students/profile
exports.getProfile = async (req, res, next) => {
  try {
    const student = await Student.findById(req.student._id).select('-password');
    if (!student) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, 'Student not found'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, student, 'Profile fetched successfully'));
  } catch (error) {
    next(error);
  }
};

// PUT /api/students/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const student = await Student.findById(req.student._id).select('+email');
    if (!student) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, 'Student not found'));
    }

    const { firstName, lastName, mobileNumber, email } = req.body;

    if (firstName !== undefined) student.firstName = firstName.trim();
    if (lastName !== undefined) student.lastName = lastName.trim();
    if (mobileNumber !== undefined) student.mobileNumber = mobileNumber.trim();

    // Allow email change only if different & not taken by another student
    if (email && email !== student.email) {
      const existing = await Student.findOne({ email: email.toLowerCase() });
      if (existing && existing._id.toString() !== student._id.toString()) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, 'Email is already in use'));
      }
      student.email = email.toLowerCase();
    }

    // Handle profile image if uploaded
    if (req.file) {
      // Delegate path construction + metrics to storage service
      const { relativePath } = recordFileUploadAndBuildPath({
        file: req.file,
        type: 'avatar',
      });

      student.profileImage = relativePath;
    }

    await student.save();

    const safeStudent = await Student.findById(student._id).select('-password');

    return res
      .status(200)
      .json(
        new ApiResponse(200, safeStudent, 'Profile updated successfully')
      );
  } catch (error) {
    next(error);
  }
};


