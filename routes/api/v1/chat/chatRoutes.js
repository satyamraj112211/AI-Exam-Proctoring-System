const express = require('express');
const router = express.Router();
const chatController = require('../../../../controllers/chat/chatController');
const authMiddleware = require('../../../../middleware/auth');
const jwt = require('jsonwebtoken');
const Student = require('../../../../models/Student');
const Teacher = require('../../../../models/Teacher');

// Combined middleware that accepts both student and teacher auth
const protectStudentOrTeacher = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Try to find student first
      const student = await Student.findById(decoded.id).select('-password');
      if (student) {
        req.user = { id: student._id.toString(), role: 'student' };
        req.student = student;
        return next();
      }

      // If not student, try teacher
      const teacher = await Teacher.findById(decoded.id).select('-password');
      if (teacher) {
        req.user = { id: teacher._id.toString(), role: 'teacher' };
        req.teacher = teacher;
        return next();
      }

      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route. Please login again.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get or create chat room for a test (student or teacher)
router.get('/room/:testId', protectStudentOrTeacher, chatController.getOrCreateChatRoom);

// Get chat messages (student or teacher)
router.get('/room/:roomId/messages', protectStudentOrTeacher, chatController.getChatMessages);

// Send message (student or teacher)
router.post('/message', protectStudentOrTeacher, chatController.sendMessage);

// Mark message as read (student or teacher)
router.post('/message/:messageId/read', protectStudentOrTeacher, chatController.markMessageAsRead);

// Get students for teacher chat panel (teacher only)
router.get('/test/:testId/students', authMiddleware.protectTeacher, chatController.getTestStudents);

module.exports = router;

