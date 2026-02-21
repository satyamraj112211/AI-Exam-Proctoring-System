const mongoose = require('mongoose');
const Student = require('../../models/Student');
const Test = require('../../models/Test');
const Attempt = require('../../models/Attempt');
const Announcement = require('../../models/Announcement');
const { examActiveTotal } = require('../../metrics/metrics');
const asyncHandler = require('../../utils/helpers/asyncHandler');
const ApiResponse = require('../../utils/helpers/apiResponse');
const logger = require('../../utils/helpers/logger');

/**
 * Calculate student statistics based on real-time attempt data
 * Returns accurate counts and averages from actual submitted tests
 */
const calculateStudentStats = async (studentId) => {
  try {
    // Get all completed/submitted attempts (real-time data from database)
    const completedAttempts = await Attempt.find({
      student: studentId,
      status: { $in: ['submitted', 'graded', 'completed'] }
    })
      .populate('test', 'title course totalMarks scheduledDate')
      .lean();

    const totalAttempts = completedAttempts.length;
    
    if (totalAttempts === 0) {
      return {
        examsCompleted: 0,
        totalExams: 0,
        averageScore: 0,
        averagePercentage: 0,
        totalTimeSpent: 0, // in hours
        totalMarksObtained: 0,
        totalMarksPossible: 0,
        passedExams: 0,
        failedExams: 0
      };
    }

    // Calculate totals
    let totalMarksObtained = 0;
    let totalMarksPossible = 0;
    let totalTimeSpent = 0; // in seconds
    let passedExams = 0;
    let failedExams = 0;

    completedAttempts.forEach(attempt => {
      totalMarksObtained += attempt.totalMarks || 0;
      totalMarksPossible += attempt.test?.totalMarks || 0;
      totalTimeSpent += attempt.timeSpent || 0;
      
      if (attempt.isPassed) {
        passedExams++;
      } else {
        failedExams++;
      }
    });

    // Calculate average percentage from individual attempt percentages
    // This is the average of all attempt percentages
    const averagePercentage = totalAttempts > 0
      ? completedAttempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / totalAttempts
      : 0;

    // Calculate average score as weighted average (total marks obtained / total marks possible)
    // This gives a more accurate representation when tests have different total marks
    const averageScore = totalMarksPossible > 0 
      ? (totalMarksObtained / totalMarksPossible) * 100 
      : 0;
    
    // Get all exams allocated to this student
    const studentObjectId = mongoose.Types.ObjectId.isValid(studentId) 
      ? new mongoose.Types.ObjectId(studentId) 
      : studentId;

    // Get all unique tests that student has access to (regardless of status)
    const allAllocatedTests = await Test.find({
      $or: [
        { allowedStudents: { $size: 0 } }, // No restrictions - available to all
        { allowedStudents: { $in: [studentObjectId] } } // Student is in allowed list
      ]
    })
      .select('_id')
      .lean();

    // Get unique test IDs from completed attempts
    const completedTestIds = new Set(
      completedAttempts
        .map(a => a.test?._id?.toString())
        .filter(Boolean)
    );

    // Total exams = all unique exams allocated to student
    // This includes both completed and available exams
    const totalAllocatedExams = allAllocatedTests.length;
    
    // Ensure totalExams is at least equal to completed exams
    // This handles edge cases where a test might have been deleted but attempt exists
    const totalExams = Math.max(totalAllocatedExams, completedTestIds.size, totalAttempts);

    return {
      examsCompleted: totalAttempts, // Number of submitted attempts
      totalExams: totalExams, // Total exams allocated to student
      averageScore: Math.round(averageScore * 100) / 100, // Weighted average score
      averagePercentage: Math.round(averagePercentage * 100) / 100, // Average of individual percentages
      totalTimeSpent: Math.round((totalTimeSpent / 3600) * 100) / 100, // Convert to hours
      totalMarksObtained: Math.round(totalMarksObtained * 100) / 100,
      totalMarksPossible: Math.round(totalMarksPossible * 100) / 100,
      passedExams,
      failedExams
    };
  } catch (error) {
    logger.error('Error calculating student stats:', error);
    throw error;
  }
};

/**
 * Get performance trends - returns both monthly aggregates and individual test attempts
 * Similar to LeetCode contest history
 */
const getPerformanceTrends = async (studentId) => {
  try {
    // Get all submitted attempts (no time limit for individual tests)
    const attempts = await Attempt.find({
      student: studentId,
      status: { $in: ['submitted', 'graded', 'completed'] }
    })
      .populate('test', 'title course testType scheduledDate totalMarks')
      .sort({ submittedAt: -1 }) // Most recent first
      .limit(50); // Limit to last 50 attempts

    // Individual test attempts for detailed view
    const individualAttempts = attempts.map(attempt => ({
      testId: attempt.test?._id?.toString(),
      testTitle: attempt.test?.title || 'Unknown Test',
      testType: attempt.test?.testType || 'mcq',
      submittedAt: attempt.submittedAt,
      percentage: attempt.percentage || 0,
      marksObtained: attempt.totalMarks || 0,
      marksPossible: attempt.test?.totalMarks || 0,
      isPassed: attempt.isPassed || false,
      date: attempt.submittedAt ? attempt.submittedAt.toISOString().split('T')[0] : null
    }));

    // Monthly aggregates for trend visualization (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentAttempts = attempts.filter(attempt => 
      attempt.submittedAt && attempt.submittedAt >= sixMonthsAgo
    );

    const monthlyData = {};
    
    recentAttempts.forEach(attempt => {
      if (attempt.submittedAt) {
        const monthKey = attempt.submittedAt.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            totalMarks: 0,
            totalPossible: 0,
            count: 0,
            percentage: 0,
            avgPercentage: 0
          };
        }
        
        monthlyData[monthKey].totalMarks += attempt.totalMarks || 0;
        monthlyData[monthKey].totalPossible += attempt.test?.totalMarks || 0;
        monthlyData[monthKey].count += 1;
      }
    });

    // Calculate monthly averages
    const monthlyTrends = Object.values(monthlyData).map(data => {
      const avgPercentage = data.totalPossible > 0 
        ? Math.round((data.totalMarks / data.totalPossible) * 100 * 100) / 100
        : 0;
      
      return {
      month: data.month,
        percentage: avgPercentage,
        examsCount: data.count,
        totalMarks: Math.round(data.totalMarks * 100) / 100,
        totalPossible: Math.round(data.totalPossible * 100) / 100
      };
    });

    // Sort by month
    monthlyTrends.sort((a, b) => a.month.localeCompare(b.month));

    // Calculate overall statistics
    const totalAttempts = individualAttempts.length;
    const avgPercentage = totalAttempts > 0
      ? Math.round((individualAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts) * 100) / 100
      : 0;

    return {
      individualAttempts,
      monthlyTrends,
      statistics: {
        totalAttempts,
        avgPercentage,
        bestScore: individualAttempts.length > 0 
          ? Math.max(...individualAttempts.map(a => a.percentage))
          : 0,
        recentScore: individualAttempts.length > 0 ? individualAttempts[0].percentage : 0
      }
    };
  } catch (error) {
    logger.error('Error getting performance trends:', error);
    return {
      individualAttempts: [],
      monthlyTrends: [],
      statistics: {
        totalAttempts: 0,
        avgPercentage: 0,
        bestScore: 0,
        recentScore: 0
      }
    };
  }
};

/**
 * Get next scheduled exam
 */
const getNextScheduledExam = async (studentId) => {
  try {
    const now = new Date();
    
    // Ensure studentId is an ObjectId
    const studentObjectId = mongoose.Types.ObjectId.isValid(studentId) 
      ? new mongoose.Types.ObjectId(studentId) 
      : studentId;
    
    logger.info(`Getting next scheduled exam for student: ${studentObjectId}`);
    
    const nextExam = await Test.findOne({
      status: { $in: ['scheduled', 'active'] },
      scheduledDate: { $gte: now },
      $or: [
        { allowedStudents: { $size: 0 } },
        { allowedStudents: { $in: [studentObjectId] } }
      ]
    })
      .populate('teacher', 'firstName lastName')
      .sort({ scheduledDate: 1 })
      .limit(1);
    
    if (nextExam) {
      logger.info(`Found next exam: ${nextExam._id} - ${nextExam.title}`);
    } else {
      logger.info(`No next exam found for student: ${studentObjectId}`);
    }

    if (!nextExam) {
      return null;
    }

    // Check if student has already attempted
    const attempt = await Attempt.findOne({
      student: studentId,
      test: nextExam._id
    });

    return {
      id: nextExam._id,
      title: nextExam.title,
      course: nextExam.course,
      scheduledDate: nextExam.scheduledDate,
      duration: nextExam.duration,
      totalMarks: nextExam.totalMarks,
      teacher: nextExam.teacher ? {
        name: `${nextExam.teacher.firstName} ${nextExam.teacher.lastName}`
      } : null,
      hasAttempted: !!attempt,
      status: nextExam.status
    };
  } catch (error) {
    logger.error('Error getting next scheduled exam:', error);
    return null;
  }
};

/**
 * Get available exams
 */
const getAvailableExams = async (studentId) => {
  try {
    const now = new Date();
    
    // Ensure studentId is an ObjectId
    const studentObjectId = mongoose.Types.ObjectId.isValid(studentId) 
      ? new mongoose.Types.ObjectId(studentId) 
      : studentId;
    
    logger.info(`Getting available exams for student: ${studentObjectId} (Type: ${typeof studentObjectId})`);
    
    // First, let's check all tests to see what we have
    const allTests = await Test.find({ status: { $in: ['scheduled', 'active'] } })
      .select('title allowedStudents scheduledDate windowCloseDate status')
      .lean();
    
    logger.info(`Total tests with scheduled/active status: ${allTests.length}`);
    allTests.forEach((test, idx) => {
      logger.info(`Test ${idx + 1}: ${test.title}, Allowed students count: ${test.allowedStudents?.length || 0}`);
      if (test.allowedStudents && test.allowedStudents.length > 0) {
        const studentInList = test.allowedStudents.some(id => 
          id.toString() === studentObjectId.toString()
        );
        logger.info(`  - Student ${studentObjectId} in list: ${studentInList}`);
        logger.info(`  - First few IDs: ${test.allowedStudents.slice(0, 3).map(id => id.toString()).join(', ')}`);
      }
    });
    
    // Find exams that:
    // 1. Are scheduled or active
    // 2. Student is allowed (in allowedStudents array or array is empty)
    // 3. Window hasn't closed (windowCloseDate >= now OR windowCloseDate is null)
    // Show ALL allocated tests - frontend will handle "not started" state
    const query = {
      status: { $in: ['scheduled', 'active'] },
      $and: [
        {
          $or: [
            { windowCloseDate: { $gte: now } }, // Window not closed yet
            { windowCloseDate: null } // No window close date set
          ]
        },
        {
          $or: [
            { allowedStudents: { $size: 0 } }, // No restrictions
            { allowedStudents: { $in: [studentObjectId] } } // Student is in allowed list
          ]
        }
      ]
    };
    
    logger.info(`Query for available exams:`, JSON.stringify(query, null, 2));
    
    const availableExams = await Test.find(query)
      .populate('teacher', 'firstName lastName')
      .sort({ scheduledDate: 1 })
      .limit(20);
    
    logger.info(`Found ${availableExams.length} available exams for student: ${studentObjectId}`);
    if (availableExams.length > 0) {
      availableExams.forEach((exam, idx) => {
        logger.info(`  Exam ${idx + 1}: ${exam.title} (ID: ${exam._id})`);
      });
    }

    // Check which exams have been attempted (only submitted/completed attempts)
    const examIds = availableExams.map(exam => exam._id);
    const attempts = await Attempt.find({
      student: studentId,
      test: { $in: examIds },
      status: { $in: ['submitted', 'graded', 'completed'] }
    });

    const attemptMap = new Map();
    attempts.forEach(attempt => {
      attemptMap.set(attempt.test.toString(), attempt);
    });

    return availableExams
      .map(exam => {
      // Determine test type - use testType field if available, otherwise infer from course
      let testType = 'MCQ';
      if (exam.testType) {
        testType = exam.testType.toUpperCase();
      } else if (exam.course?.toLowerCase() === 'general') {
        testType = 'MCQ';
      } else if (exam.course?.toLowerCase() === 'coding') {
        testType = 'CODING';
      } else if (exam.course?.toLowerCase() === 'hybrid') {
        testType = 'HYBRID';
      }

        const examData = {
        id: exam._id,
        title: exam.title,
        course: exam.course,
        description: exam.description || '',
        scheduledDate: exam.scheduledDate,
        windowCloseDate: exam.windowCloseDate || null,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        testType: testType,
        teacher: exam.teacher ? {
          name: `${exam.teacher.firstName} ${exam.teacher.lastName}`
        } : null,
        hasAttempted: attemptMap.has(exam._id.toString()),
        status: exam.status
      };
        return examData;
      })
      // Remove exams already attempted
      .filter(exam => !exam.hasAttempted);
  } catch (error) {
    logger.error('Error getting available exams:', error);
    return [];
  }
};

/**
 * Get recent announcements
 */
const getAnnouncements = async (limit = 5) => {
  try {
    const now = new Date();
    
    const announcements = await Announcement.find({
      isActive: true,
      targetAudience: { $in: ['all', 'students'] },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: now } }
      ]
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit);

    return announcements.map(announcement => ({
      id: announcement._id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      createdAt: announcement.createdAt
    }));
  } catch (error) {
    logger.error('Error getting announcements:', error);
    return [];
  }
};

/**
 * @desc    Get student dashboard data
 * @route   GET /api/v1/student/dashboard
 * @access  Private
 */
exports.getDashboard = asyncHandler(async (req, res) => {
  try {
    const studentId = req.user?.id || req.student?._id;
    
    if (!studentId) {
      logger.warn('Dashboard access attempted without student ID');
      return res.status(401).json(
        new ApiResponse(401, null, 'Student ID not found')
      );
    }

    logger.info(`Fetching dashboard for student ID: ${studentId}`);

    // Get student info
    const student = await Student.findById(studentId).select(
      'firstName lastName email institution institutionType branch batchYear currentYear section profileImage mobileNumber',
    );
    
    if (!student) {
      logger.warn(`Student not found with ID: ${studentId}`);
      return res.status(404).json(
        new ApiResponse(404, null, 'Student not found')
      );
    }
    
    logger.info(`Student found: ${student.email} - ${student.institution?.name} - ${student.branch?.code} - Batch ${student.batchYear} - Year ${student.currentYear} - Section ${student.section}`);
    logger.info(`Student ObjectId: ${student._id}, Type: ${typeof student._id}`);

    // Get all dashboard data in parallel
    const [
      stats,
      nextExam,
      availableExams,
      announcements,
      performanceTrends
    ] = await Promise.all([
      calculateStudentStats(studentId),
      getNextScheduledExam(studentId),
      getAvailableExams(studentId),
      getAnnouncements(5),
      getPerformanceTrends(studentId)
    ]);

    // Update exam availability gauge for observability.
    // This represents how many exams are currently visible to this student.
    if (Array.isArray(availableExams)) {
      try {
        examActiveTotal.set(availableExams.length);
      } catch (metricErr) {
        // Metrics should never break the main request flow
        logger.error('Failed to update examActiveTotal metric:', metricErr);
      }
    }

    logger.info(`Dashboard data prepared - Available exams: ${availableExams.length}, Next exam: ${nextExam ? nextExam.title : 'None'}`);

    const dashboardData = {
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        mobileNumber: student.mobileNumber,
        profileImage: student.profileImage,
        institution: student.institution,
        institutionType: student.institutionType,
        branch: student.branch,
        batchYear: student.batchYear,
        currentYear: student.currentYear,
        section: student.section,
      },
      nextScheduledExam: nextExam,
      quickStats: {
        examsCompleted: stats.examsCompleted,
        totalExams: stats.totalExams,
        averageScore: stats.averageScore,
        averagePercentage: stats.averagePercentage,
        totalTimeSpent: stats.totalTimeSpent,
        passedExams: stats.passedExams,
        failedExams: stats.failedExams
      },
      performanceTrends,
      announcements,
      availableExams
    };

    logger.info(`Dashboard data fetched for student: ${studentId}`);

    res.status(200).json(
      new ApiResponse(200, dashboardData, 'Dashboard data retrieved successfully')
    );
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json(
      new ApiResponse(500, null, 'Failed to fetch dashboard data')
    );
  }
});

