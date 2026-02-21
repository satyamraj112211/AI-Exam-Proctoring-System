const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const ApiResponse = require('../utils/helpers/apiResponse.js');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json(
        new ApiResponse(401, null, 'Not authorized to access this route')
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const student = await Student.findById(decoded.id).select('-password');
      if (!student) {
        return res.status(401).json(
          new ApiResponse(401, null, 'Student not found')
        );
      }
      req.user = { id: student._id.toString(), role: 'student' };
      req.student = student;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json(
        new ApiResponse(401, null, 'Not authorized to access this route. Please login again.')
      );
    }
  } catch (error) {
    next(error);
  }
};

exports.protectTeacher = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json(
        new ApiResponse(401, null, 'Not authorized to access this route')
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const teacher = await Teacher.findById(decoded.id).select('-password');
      if (!teacher) {
        return res.status(401).json(
          new ApiResponse(401, null, 'Teacher not found')
        );
      }
      req.user = { id: teacher._id.toString(), role: 'teacher' };
      req.teacher = teacher;
      next();
    } catch (error) {
      console.error('Teacher auth middleware error:', error.message);
      return res.status(401).json(
        new ApiResponse(401, null, 'Not authorized to access this route. Please login again.')
      );
    }
  } catch (error) {
    next(error);
  }
};