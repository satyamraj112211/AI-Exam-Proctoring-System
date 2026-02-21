const Test = require('../../models/Test');
const Question = require('../../models/Question');
const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');
const ApiResponse = require('../../utils/helpers/apiResponse');
const asyncHandler = require('../../utils/helpers/asyncHandler');
const logger = require('../../utils/helpers/logger');
const { examCreatedTotal } = require('../../metrics/metrics');
const mongoose = require('mongoose');

/**
 * Resolve student filters to actual Student._id values
 * @param {Array} studentFilters - Array of filter objects with institutionId, branchCode, batchYear, currentYear, section
 * @returns {Promise<Array>} Array of Student._id values
 */
const resolveStudentFilters = async (studentFilters) => {
  if (!Array.isArray(studentFilters) || studentFilters.length === 0) {
    return [];
  }

  const studentIdMap = new Map(); // Use Map to track unique ObjectIds by string representation

  for (const filter of studentFilters) {
    const { institutionId, branchCode, batchYear, currentYear, section } = filter;

    if (!institutionId || !branchCode || !batchYear || !currentYear || !section) {
      logger.warn('Invalid student filter:', filter);
      continue;
    }

    const query = {
      'institution.id': institutionId,
      'branch.code': branchCode.toUpperCase(),
      batchYear: Number(batchYear),
      currentYear: Number(currentYear),
      section: section.trim().toUpperCase(),
    };

    try {
      logger.info(`Resolving students with filter:`, JSON.stringify(query));
      const students = await Student.find(query).select('_id email firstName lastName');
      logger.info(`Found ${students.length} students for filter:`, JSON.stringify(query));
      
      if (students.length > 0) {
        logger.info(`Student emails found:`, students.map(s => s.email).join(', '));
      }
      
      students.forEach((student) => {
        // Use string representation as key to ensure uniqueness
        const idStr = student._id.toString();
        if (!studentIdMap.has(idStr)) {
          studentIdMap.set(idStr, student._id);
        }
      });
    } catch (error) {
      logger.error('Error resolving student filter:', error);
      throw error;
    }
  }

  // Return array of ObjectIds
  return Array.from(studentIdMap.values());
};

/**
 * Resolve teacher IDs to actual Teacher._id values
 * @param {Array} teacherIds - Array of teacher ID strings
 * @returns {Promise<Array>} Array of Teacher._id values
 */
const resolveTeacherIds = async (teacherIds) => {
  if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
    return [];
  }

  const teacherObjectIds = [];

  for (const teacherId of teacherIds) {
    if (!teacherId || typeof teacherId !== 'string') {
      continue;
    }

    const normalizedId = teacherId.trim().toUpperCase();
    try {
      const teacher = await Teacher.findOne({ teacherId: normalizedId }).select('_id');
      if (teacher) {
        teacherObjectIds.push(teacher._id);
      } else {
        logger.warn(`Teacher with ID ${normalizedId} not found`);
      }
    } catch (error) {
      logger.error('Error resolving teacher ID:', error);
    }
  }

  return teacherObjectIds;
};

/**
 * @desc    Create a new test with questions and student allocation
 * @route   POST /api/v1/tests
 * @access  Private (Admin/Teacher)
 */
exports.createTest = asyncHandler(async (req, res) => {
  try {
    const { name, type, questions, schedule, allocations } = req.body;

    // Validation
    if (!name || !type || !questions || !schedule || !allocations) {
      return res.status(400).json(
        new ApiResponse(400, null, 'Missing required fields: name, type, questions, schedule, allocations')
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json(
        new ApiResponse(400, null, 'At least one question is required')
      );
    }

    if (!schedule.start || !schedule.duration) {
      return res.status(400).json(
        new ApiResponse(400, null, 'Schedule must include start date and duration')
      );
    }

    if (!allocations.studentFilters || !Array.isArray(allocations.studentFilters)) {
      return res.status(400).json(
        new ApiResponse(400, null, 'Student filters must be an array')
      );
    }

    if (allocations.studentFilters.length === 0) {
      return res.status(400).json(
        new ApiResponse(400, null, 'At least one student group must be allocated')
      );
    }

    // Resolve student filters to Student._id values
    logger.info('Resolving student filters to student IDs...');
    logger.info('Student filters received:', JSON.stringify(allocations.studentFilters, null, 2));
    
    const allowedStudentIds = await resolveStudentFilters(allocations.studentFilters);

    if (allowedStudentIds.length === 0) {
      logger.warn('No students found matching filters:', JSON.stringify(allocations.studentFilters));
      return res.status(400).json(
        new ApiResponse(400, null, 'No students found matching the provided filters. Please verify the institution, branch, year, and section are correct.')
      );
    }

    logger.info(`Resolved ${allowedStudentIds.length} students for test allocation`);
    logger.info(`Student IDs (first 5):`, allowedStudentIds.slice(0, 5).map(id => id.toString()).join(', '));
    
    // Log student emails for verification
    if (allowedStudentIds.length > 0) {
      const studentDetails = await Student.find({ _id: { $in: allowedStudentIds.slice(0, 10) } })
        .select('email firstName lastName')
        .lean();
      logger.info(`Student emails (first 10):`, studentDetails.map(s => s.email).join(', '));
    }

    // Resolve teacher IDs (optional - for proctoring)
    let teacherObjectId = null;
    if (allocations.teacherIds && Array.isArray(allocations.teacherIds) && allocations.teacherIds.length > 0) {
      const resolvedTeachers = await resolveTeacherIds(allocations.teacherIds);
      if (resolvedTeachers.length > 0) {
        teacherObjectId = resolvedTeachers[0]; // Use first teacher as primary
      }
    }

    // If no teacher found, try to get from session or use a default
    // For now, we'll require a teacher - you can modify this based on your auth setup
    if (!teacherObjectId) {
      // Try to get teacher from session if available
      const sessionTeacherId = req.user?.teacherId || req.teacher?._id;
      if (sessionTeacherId) {
        teacherObjectId = sessionTeacherId;
      } else {
        // For MVP, create a placeholder or use first available teacher
        const firstTeacher = await Teacher.findOne().select('_id');
        if (firstTeacher) {
          teacherObjectId = firstTeacher._id;
        } else {
          return res.status(400).json(
            new ApiResponse(400, null, 'No teacher available. Please ensure at least one teacher is registered.')
          );
        }
      }
    }

    // Parse schedule dates
    const scheduledDate = new Date(schedule.start);
    let windowCloseDate = schedule.windowClose ? new Date(schedule.windowClose) : null;

    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json(
        new ApiResponse(400, null, 'Invalid start date format')
      );
    }

    // If windowCloseDate is not provided or invalid, calculate from scheduledDate + duration
    if (!windowCloseDate || isNaN(windowCloseDate.getTime())) {
      windowCloseDate = new Date(scheduledDate.getTime() + (Number(schedule.duration) * 60 * 1000));
    }

    // Calculate total marks from questions
    const totalMarks = questions.reduce((sum, q) => {
      return sum + (q.marks || 1);
    }, 0);

    // Create Test document
    const testData = {
      title: name.trim(),
      description: `${type.toUpperCase()} Test: ${name}`,
      course: type === 'mcq' ? 'General' : type, // You can customize this
      testType: type.toLowerCase(), // Store the actual test type (mcq, coding, hybrid)
      teacher: teacherObjectId,
      scheduledDate,
      windowCloseDate,
      duration: Number(schedule.duration),
      totalMarks,
      passingMarks: Math.ceil(totalMarks * 0.4), // 40% default
      status: 'scheduled',
      isActive: true,
      allowedStudents: allowedStudentIds,
      instructions: 'Please read all instructions carefully before starting the test. Do not open developer tools or switch tabs during the test.',
    };

    const test = new Test(testData);
    await test.save();

    logger.info(`Test created with ID: ${test._id}, Title: ${test.title}`);
    // Record exam creation for observability
    try {
      examCreatedTotal.inc({
        test_type: String(test.testType || type || 'unknown').toLowerCase(),
      });
    } catch (metricErr) {
      logger.error('Failed to increment examCreatedTotal metric:', metricErr);
    }
    logger.info(`Test allocated to ${allowedStudentIds.length} students`);
    
    // Verify the test was saved correctly
    const savedTest = await Test.findById(test._id).select('title allowedStudents testType scheduledDate windowCloseDate').lean();
    logger.info(`Saved test verification - Allowed students count: ${savedTest.allowedStudents?.length || 0}`);
    if (savedTest.allowedStudents && savedTest.allowedStudents.length > 0) {
      logger.info(`First 3 student IDs in saved test: ${savedTest.allowedStudents.slice(0, 3).map(id => id.toString()).join(', ')}`);
    }

    // Create Question documents
    const questionDocuments = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // Validate question structure
      if (!q.prompt || !Array.isArray(q.options) || q.options.length < 2) {
        logger.warn(`Skipping invalid question at index ${i}`);
        continue;
      }

      // For MCQ, correctOptions should be an array of selected option strings
      const correctAnswer = Array.isArray(q.correctOptions) && q.correctOptions.length > 0
        ? q.correctOptions[0] // Use first correct option
        : q.correctOptions || q.options[0]; // Fallback

      const questionData = {
        test: test._id,
        questionText: q.prompt.trim(),
        questionType: 'multiple_choice',
        options: q.options.map(opt => String(opt).trim()),
        correctAnswer: String(correctAnswer).trim(),
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks || 0,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        order: i + 1,
      };

      const question = new Question(questionData);
      await question.save();
      questionDocuments.push(question);
    }

    // Update test with question references
    test.questions = questionDocuments.map(q => q._id);
    await test.save();

    logger.info(`Created ${questionDocuments.length} questions for test ${test._id}`);

    // Return created test with populated data
    const populatedTest = await Test.findById(test._id)
      .populate('teacher', 'firstName lastName email')
      .populate('questions', 'questionText options correctAnswer marks order')
      .lean();

    res.status(201).json(
      new ApiResponse(201, {
        test: populatedTest,
        allocatedStudents: allowedStudentIds.length,
        questionsCreated: questionDocuments.length,
      }, 'Test created and allocated successfully')
    );
  } catch (error) {
    logger.error('Error creating test:', error);
    res.status(500).json(
      new ApiResponse(500, null, 'Failed to create test: ' + error.message)
    );
  }
});

/**
 * @desc    Get all tests (for admin dashboard)
 * @route   GET /api/v1/tests
 * @access  Private (Admin)
 */
exports.getAllTests = asyncHandler(async (req, res) => {
  try {
    const tests = await Test.find({})
      .populate('teacher', 'firstName lastName')
      .select('title course scheduledDate windowCloseDate duration totalMarks status allowedStudents createdAt')
      .sort({ scheduledDate: -1 })
      .lean();

    // Format response with allocation counts
    const formattedTests = tests.map(test => ({
      id: test._id,
      name: test.title,
      type: test.course,
      scheduledDate: test.scheduledDate,
      windowCloseDate: test.windowCloseDate,
      duration: test.duration,
      totalMarks: test.totalMarks,
      status: test.status,
      allocatedTo: (test.allowedStudents?.length || 0) + (test.teacher ? 1 : 0), // Students + teacher
      studentCount: test.allowedStudents?.length || 0,
      teacher: test.teacher ? {
        name: `${test.teacher.firstName} ${test.teacher.lastName}`
      } : null,
      createdAt: test.createdAt,
    }));

    res.status(200).json(
      new ApiResponse(200, { tests: formattedTests, count: formattedTests.length }, 'Tests retrieved successfully')
    );
  } catch (error) {
    logger.error('Error fetching tests:', error);
    res.status(500).json(
      new ApiResponse(500, null, 'Failed to fetch tests')
    );
  }
});

/**
 * @desc    Get test by ID (for student exam page)
 * @route   GET /api/v1/tests/:id
 * @access  Private (Student)
 */
exports.getTestById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.id || req.student?._id;

    logger.info(`Getting test ${id} for student: ${studentId}`);

    if (!studentId) {
      logger.warn('Test access attempted without student ID');
      return res.status(401).json(
        new ApiResponse(401, null, 'Student authentication required. Please login again.')
      );
    }

    const test = await Test.findById(id)
      .populate('teacher', 'firstName lastName')
      .populate('questions', 'questionText options correctAnswer marks negativeMarks order')
      .lean();

    if (!test) {
      return res.status(404).json(
        new ApiResponse(404, null, 'Test not found')
      );
    }

    // Check if student is allowed to access this test
    if (test.allowedStudents && test.allowedStudents.length > 0) {
      const studentObjectId = mongoose.Types.ObjectId.isValid(studentId) 
        ? new mongoose.Types.ObjectId(studentId) 
        : studentId;
      
      const isAllowed = test.allowedStudents.some(
        allowedId => allowedId.toString() === studentObjectId.toString()
      );
      
      if (!isAllowed) {
        return res.status(403).json(
          new ApiResponse(403, null, 'You are not allocated to this test')
        );
      }
    }

    // Remove correct answers from questions for security
    const questionsWithoutAnswers = test.questions.map(q => ({
      id: q._id,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      order: q.order,
      // Do not include correctAnswer
    }));

    const testData = {
      id: test._id,
      title: test.title,
      description: test.description,
      course: test.course,
      scheduledDate: test.scheduledDate,
      duration: test.duration,
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      instructions: test.instructions,
      status: test.status,
      teacher: test.teacher ? {
        name: `${test.teacher.firstName} ${test.teacher.lastName}`
      } : null,
      questions: questionsWithoutAnswers,
      questionCount: questionsWithoutAnswers.length,
    };

    res.status(200).json(
      new ApiResponse(200, testData, 'Test retrieved successfully')
    );
  } catch (error) {
    logger.error('Error fetching test:', error);
    res.status(500).json(
      new ApiResponse(500, null, 'Failed to fetch test')
    );
  }
});

/**
 * @desc    Diagnostic endpoint to check test allocation
 * @route   GET /api/v1/tests/diagnostic/:studentEmail
 * @access  Private (Admin/Dev)
 */
exports.diagnosticCheck = asyncHandler(async (req, res) => {
  try {
    const { studentEmail } = req.params;
    
    // Find student by email
    const student = await Student.findOne({ email: studentEmail.toLowerCase().trim() })
      .select('_id email firstName lastName institution branch batchYear currentYear section');
    
    if (!student) {
      return res.status(404).json(
        new ApiResponse(404, null, `Student with email ${studentEmail} not found`)
      );
    }

    // Find all tests allocated to this student
    const tests = await Test.find({
      allowedStudents: { $in: [student._id] }
    })
      .select('title scheduledDate status allowedStudents')
      .lean();

    // Get upcoming tests
    const now = new Date();
    const upcomingTests = tests.filter(t => 
      t.status === 'scheduled' && new Date(t.scheduledDate) >= now
    );

    return res.status(200).json(
      new ApiResponse(200, {
        student: {
          id: student._id,
          email: student.email,
          name: `${student.firstName} ${student.lastName}`,
          institution: student.institution?.name,
          branch: student.branch?.code,
          batchYear: student.batchYear,
          currentYear: student.currentYear,
          section: student.section,
        },
        totalTestsAllocated: tests.length,
        upcomingTests: upcomingTests.length,
        tests: tests.map(t => ({
          id: t._id,
          title: t.title,
          scheduledDate: t.scheduledDate,
          status: t.status,
          allocatedToCount: t.allowedStudents?.length || 0,
        })),
      }, 'Diagnostic check completed')
    );
  } catch (error) {
    logger.error('Error in diagnostic check:', error);
    res.status(500).json(
      new ApiResponse(500, null, 'Failed to perform diagnostic check')
    );
  }
});

/**
 * @desc    Get proctoring participants for a test (allocated students)
 * @route   GET /api/v1/tests/:id/proctoring/participants
 * @access  Private (Teacher/Admin UI – currently no role check, rely on API gateway/frontend)
 */
exports.getProctoringParticipants = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const test = await Test.findById(id)
      .populate('allowedStudents', 'firstName lastName email batchYear currentYear section branch institution')
      .select('title course scheduledDate duration allowedStudents status')
      .lean();

    if (!test) {
      return res.status(404).json(
        new ApiResponse(404, null, 'Test not found')
      );
    }

    const students = (test.allowedStudents || []).map((s) => ({
      id: s._id,
      name: `${s.firstName} ${s.lastName}`,
      email: s.email,
      batchYear: s.batchYear,
      currentYear: s.currentYear,
      section: s.section,
      branch: s.branch?.code || s.branch,
      institution: s.institution?.name || s.institution,
    }));

    const payload = {
      test: {
        id: test._id,
        title: test.title,
        course: test.course,
        scheduledDate: test.scheduledDate,
        duration: test.duration,
        status: test.status,
        totalStudents: students.length,
      },
      students,
    };

    return res.status(200).json(
      new ApiResponse(200, payload, 'Proctoring participants retrieved successfully')
    );
  } catch (error) {
    logger.error('Error fetching proctoring participants:', error);
    return res.status(500).json(
      new ApiResponse(500, null, 'Failed to fetch proctoring participants')
    );
  }
});
