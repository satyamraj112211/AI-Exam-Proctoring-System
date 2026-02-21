const express = require('express');
const router = express.Router();
const attemptController = require('../../../../controllers/test/attemptController');
const { protect } = require('../../../../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/v1/tests/:testId/attempts
 * @desc    Submit test attempt
 * @access  Private (Student)
 */
router.post('/:testId/attempts', attemptController.submitAttempt);

/**
 * @route   GET /api/v1/tests/:testId/attempts/result
 * @desc    Get attempt result
 * @access  Private (Student)
 */
router.get('/:testId/attempts/result', attemptController.getAttemptResult);

/**
 * @route   GET /api/v1/tests/:testId/attempts/check
 * @desc    Check if student has attempted a test
 * @access  Private (Student)
 */
router.get('/:testId/attempts/check', attemptController.checkAttempt);

/**
 * @route   GET /api/v1/tests/attempts/my
 * @desc    List all attempts for the logged-in student
 * @access  Private (Student)
 */
router.get('/attempts/my', attemptController.getMyAttempts);

module.exports = router;

