const express = require('express');
const router = express.Router();
const dashboardController = require('../../../controllers/student/dashboardController');
const announcementController = require('../../../controllers/announcement/announcementController');
const authMiddleware = require('../../../middleware/auth');

// All routes require authentication
router.use(authMiddleware.protect);

// Dashboard routes
router.get('/dashboard', dashboardController.getDashboard);

// Announcement routes
router.get('/announcements', announcementController.getStudentAnnouncements);
router.post('/announcements/:id/read', announcementController.markStudentAnnouncementRead);

// Debug endpoint to check student allocation
router.get('/debug/tests', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Test = require('../../../models/Test');
    const Student = require('../../../models/Student');
    
    const studentId = req.user?.id || req.student?._id;
    if (!studentId) {
      return res.status(401).json({ error: 'Student ID not found' });
    }

    const student = await Student.findById(studentId).select('email firstName lastName');
    const studentObjectId = mongoose.Types.ObjectId.isValid(studentId) 
      ? new mongoose.Types.ObjectId(studentId) 
      : studentId;

    // Get all tests
    const allTests = await Test.find({ status: { $in: ['scheduled', 'active'] } })
      .select('title allowedStudents scheduledDate windowCloseDate status testType')
      .lean();

    // Check which tests this student is allocated to
    const allocatedTests = allTests.filter(test => {
      if (!test.allowedStudents || test.allowedStudents.length === 0) return true;
      return test.allowedStudents.some(id => id.toString() === studentObjectId.toString());
    });

    res.json({
      student: {
        id: studentId,
        email: student?.email,
        name: student ? `${student.firstName} ${student.lastName}` : 'Unknown'
      },
      totalTests: allTests.length,
      allocatedTests: allocatedTests.length,
      tests: allTests.map(test => ({
        title: test.title,
        testType: test.testType,
        scheduledDate: test.scheduledDate,
        windowCloseDate: test.windowCloseDate,
        allowedStudentsCount: test.allowedStudents?.length || 0,
        isAllocated: allocatedTests.some(t => t._id.toString() === test._id.toString()),
        studentInList: test.allowedStudents?.some(id => id.toString() === studentObjectId.toString()) || false
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
