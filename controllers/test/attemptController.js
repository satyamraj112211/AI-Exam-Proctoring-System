const mongoose = require('mongoose');
const Attempt = require('../../models/Attempt');
const Test = require('../../models/Test');
const Question = require('../../models/Question');
const asyncHandler = require('../../utils/helpers/asyncHandler');
const ApiResponse = require('../../utils/helpers/apiResponse');
const logger = require('../../utils/helpers/logger');

/**
 * Professional result calculation based on test type
 * Handles different scoring mechanisms for MCQ, Coding, and Hybrid tests
 */
const calculateResult = async (test, answers) => {
  try {
    const testType = test.testType?.toLowerCase() || 'mcq';
    const questions = await Question.find({ test: test._id }).sort({ order: 1 });
    
    let totalMarksObtained = 0;
    let totalMarksPossible = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let attemptedQuestions = 0;
    let notAttemptedQuestions = 0;
    const answerDetails = [];

    // Process each question
    for (const question of questions) {
      totalMarksPossible += question.marks || 0;
      
      // Find student's answer for this question
      const studentAnswer = answers.find(
        ans => ans.questionId && ans.questionId.toString() === question._id.toString()
      );

      const selectedAnswer = studentAnswer?.selectedAnswer || null;
      const isAttempted = selectedAnswer !== null && selectedAnswer !== undefined && selectedAnswer !== '';
      
      let isCorrect = false;
      let marksObtained = 0;

      if (isAttempted) {
        attemptedQuestions++;
        
        // Compare answers based on test type
        if (testType === 'mcq' || testType === 'hybrid') {
          // For MCQ: exact match (case-insensitive, trimmed)
          const correctAns = (question.correctAnswer || '').toString().trim().toLowerCase();
          const selectedAns = (selectedAnswer || '').toString().trim().toLowerCase();
          
          isCorrect = correctAns === selectedAns;
          
          if (isCorrect) {
            marksObtained = question.marks || 0;
            correctAnswers++;
          } else {
            // Apply negative marking if configured
            const negativeMarks = question.negativeMarks || 0;
            marksObtained = -negativeMarks;
            wrongAnswers++;
          }
        } else if (testType === 'coding') {
          // For coding questions: might need manual evaluation
          // For now, treat as correct if answer is provided (can be enhanced later)
          isCorrect = true; // Placeholder - coding questions typically need manual grading
          marksObtained = question.marks || 0;
          correctAnswers++;
        }
      } else {
        notAttemptedQuestions++;
        marksObtained = 0;
      }

      totalMarksObtained += marksObtained;
      
      answerDetails.push({
        questionId: question._id,
        questionText: question.questionText,
        selectedAnswer: selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
        marksObtained: marksObtained,
        maxMarks: question.marks || 0,
        negativeMarks: question.negativeMarks || 0,
        isAttempted: isAttempted
      });
    }

    // Calculate percentage
    const percentage = totalMarksPossible > 0 
      ? Math.round((totalMarksObtained / totalMarksPossible) * 100 * 100) / 100 
      : 0;

    // Determine if passed
    const passingMarks = test.passingMarks || 0;
    const isPassed = totalMarksObtained >= passingMarks;

    return {
      totalMarksObtained: Math.round(totalMarksObtained * 100) / 100,
      totalMarksPossible,
      percentage,
      isPassed,
      correctAnswers,
      wrongAnswers,
      attemptedQuestions,
      notAttemptedQuestions,
      answerDetails
    };
  } catch (error) {
    logger.error('Error calculating result:', error);
    throw error;
  }
};

/**
 * @desc    Submit test attempt
 * @route   POST /api/v1/tests/:testId/attempts
 * @access  Private (Student)
 */
exports.submitAttempt = asyncHandler(async (req, res) => {
  try {
    const { testId } = req.params;
    const studentId = req.user?.id || req.student?._id;
    const { answers, timeSpent, isAutoSubmitted = false } = req.body;

    if (!studentId) {
      return res.status(401).json(
        new ApiResponse(401, null, 'Student authentication required')
      );
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json(
        new ApiResponse(400, null, 'Answers array is required')
      );
    }

    logger.info(`Submitting attempt for test ${testId} by student ${studentId}`);

    // Check if test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json(
        new ApiResponse(404, null, 'Test not found')
      );
    }

    // Check if student is allowed to attempt this test
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

    // Check if attempt already exists
    const existingAttempt = await Attempt.findOne({
      student: studentId,
      test: testId
    });

    if (existingAttempt) {
      // If already submitted, return error
      if (existingAttempt.status !== 'in_progress') {
        return res.status(400).json(
          new ApiResponse(400, null, 'Test has already been submitted')
        );
      }
      // If in_progress, we'll update it below
    }

    // Calculate result
    const result = await calculateResult(test, answers);

    // Prepare answer documents
    const answerDocuments = result.answerDetails.map(detail => ({
      questionId: detail.questionId,
      selectedAnswer: detail.selectedAnswer,
      isCorrect: detail.isCorrect,
      marksObtained: detail.marksObtained
    }));

    // Create or update attempt
    let attempt;
    if (existingAttempt) {
      // Update existing attempt
      attempt = await Attempt.findByIdAndUpdate(
        existingAttempt._id,
        {
          answers: answerDocuments,
          totalMarks: result.totalMarksObtained,
          percentage: result.percentage,
          status: 'submitted',
          submittedAt: new Date(),
          timeSpent: timeSpent || existingAttempt.timeSpent || 0,
          isPassed: result.isPassed,
          updatedAt: new Date()
        },
        { new: true }
      );
    } else {
      // Create new attempt
      attempt = await Attempt.create({
        student: studentId,
        test: testId,
        answers: answerDocuments,
        totalMarks: result.totalMarksObtained,
        percentage: result.percentage,
        status: 'submitted',
        submittedAt: new Date(),
        startedAt: new Date(),
        timeSpent: timeSpent || 0,
        isPassed: result.isPassed
      });
    }

    logger.info(`Attempt submitted successfully: ${attempt._id}, Score: ${result.totalMarksObtained}/${result.totalMarksPossible}`);

    // Return result summary
    const responseData = {
      attemptId: attempt._id,
      testId: test._id,
      testTitle: test.title,
      totalMarksObtained: result.totalMarksObtained,
      totalMarksPossible: result.totalMarksPossible,
      percentage: result.percentage,
      isPassed: result.isPassed,
      correctAnswers: result.correctAnswers,
      wrongAnswers: result.wrongAnswers,
      attemptedQuestions: result.attemptedQuestions,
      notAttemptedQuestions: result.notAttemptedQuestions,
      submittedAt: attempt.submittedAt,
      isAutoSubmitted: isAutoSubmitted
    };

    res.status(200).json(
      new ApiResponse(200, responseData, 'Test submitted successfully')
    );
  } catch (error) {
    logger.error('Error submitting attempt:', error);
    res.status(500).json(
      new ApiResponse(500, null, 'Failed to submit test attempt')
    );
  }
});

/**
 * @desc    Get attempt result
 * @route   GET /api/v1/tests/:testId/attempts/result
 * @access  Private (Student)
 */
exports.getAttemptResult = asyncHandler(async (req, res) => {
  try {
    const { testId } = req.params;
    const studentId = req.user?.id || req.student?._id;

    if (!studentId) {
      return res.status(401).json(
        new ApiResponse(401, null, 'Student authentication required')
      );
    }

    logger.info(`Getting result for test ${testId} by student ${studentId}`);

    // Find attempt
    const attempt = await Attempt.findOne({
      student: studentId,
      test: testId,
      status: { $in: ['submitted', 'graded', 'completed'] }
    })
      .populate('test', 'title description course testType totalMarks passingMarks duration scheduledDate')
      .populate('answers.questionId', 'questionText options correctAnswer marks negativeMarks explanation order');

    if (!attempt) {
      return res.status(404).json(
        new ApiResponse(404, null, 'Attempt not found or not submitted yet')
      );
    }

    // Get test details
    const test = attempt.test;

    // Prepare detailed result
    const answerDetails = attempt.answers.map(answer => {
      const question = answer.questionId;
      return {
        questionId: question._id,
        questionText: question.questionText,
        options: question.options,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: answer.isCorrect,
        marksObtained: answer.marksObtained,
        maxMarks: question.marks || 0,
        negativeMarks: question.negativeMarks || 0,
        explanation: question.explanation,
        order: question.order || 0
      };
    }).sort((a, b) => (a.order || 0) - (b.order || 0));

    // Calculate statistics
    const correctAnswers = answerDetails.filter(a => a.isCorrect).length;
    const wrongAnswers = answerDetails.filter(a => !a.isCorrect && a.selectedAnswer).length;
    const attemptedQuestions = answerDetails.filter(a => a.selectedAnswer).length;
    const notAttemptedQuestions = answerDetails.length - attemptedQuestions;

    const resultData = {
      attemptId: attempt._id,
      test: {
        id: test._id,
        title: test.title,
        description: test.description,
        course: test.course,
        testType: test.testType,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        duration: test.duration,
        scheduledDate: test.scheduledDate
      },
      result: {
        totalMarksObtained: attempt.totalMarks,
        totalMarksPossible: test.totalMarks,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        correctAnswers,
        wrongAnswers,
        attemptedQuestions,
        notAttemptedQuestions
      },
      answers: answerDetails,
      submittedAt: attempt.submittedAt,
      startedAt: attempt.startedAt,
      timeSpent: attempt.timeSpent
    };

    res.status(200).json(
      new ApiResponse(200, resultData, 'Result retrieved successfully')
    );
  } catch (error) {
    logger.error('Error getting attempt result:', error);
    res.status(500).json(
      new ApiResponse(500, null, 'Failed to retrieve result')
    );
  }
});

/**
 * @desc    Check if student has attempted a test
 * @route   GET /api/v1/tests/:testId/attempts/check
 * @access  Private (Student)
 */
exports.checkAttempt = asyncHandler(async (req, res) => {
  try {
    const { testId } = req.params;
    const studentId = req.user?.id || req.student?._id;

    if (!studentId) {
      return res.status(401).json(
        new ApiResponse(401, null, 'Student authentication required')
      );
    }

    const attempt = await Attempt.findOne({
      student: studentId,
      test: testId
    });

    res.status(200).json(
      new ApiResponse(200, {
        hasAttempted: !!attempt,
        status: attempt?.status || null,
        submittedAt: attempt?.submittedAt || null
      }, 'Check completed')
    );
  } catch (error) {
    logger.error('Error checking attempt:', error);
    res.status(500).json(
      new ApiResponse(500, null, 'Failed to check attempt')
    );
  }
});

/**
 * @desc    List all attempts for the logged-in student
 * @route   GET /api/v1/tests/attempts/my
 * @access  Private (Student)
 */
exports.getMyAttempts = asyncHandler(async (req, res) => {
  try {
    const studentId = req.user?.id || req.student?._id;

    if (!studentId) {
      return res.status(401).json(
        new ApiResponse(401, null, 'Student authentication required')
      );
    }

    const attempts = await Attempt.find({
      student: studentId,
      status: { $in: ['submitted', 'graded', 'completed'] }
    })
      .populate('test', 'title course testType totalMarks duration scheduledDate')
      .sort({ submittedAt: -1 })
      .lean();

    const mapped = attempts.map((attempt) => ({
      id: attempt._id,
      testId: attempt.test?._id,
      testTitle: attempt.test?.title || 'Unknown Test',
      course: attempt.test?.course || 'General',
      testType: attempt.test?.testType || 'mcq',
      totalMarksObtained: attempt.totalMarks || 0,
      totalMarksPossible: attempt.test?.totalMarks || 0,
      percentage: attempt.percentage || 0,
      isPassed: attempt.isPassed || false,
      submittedAt: attempt.submittedAt,
    }));

    res.status(200).json(new ApiResponse(200, mapped, 'Attempts fetched successfully'));
  } catch (error) {
    logger.error('Error fetching student attempts:', error);
    res.status(500).json(
      new ApiResponse(500, null, 'Failed to fetch attempts')
    );
  }
});

