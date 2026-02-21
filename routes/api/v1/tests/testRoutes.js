const express = require('express');
const router = express.Router();
const testController = require('../../../../controllers/test/testController');
const attemptRoutes = require('./attemptRoutes');
const { protect } = require('../../../../middleware/auth');

/**
 * @route   POST /api/v1/tests
 * @desc    Create a new test with questions and student allocation
 * @access  Private (Admin/Teacher)
 */
router.post('/', testController.createTest);

/**
 * @route   GET /api/v1/tests
 * @desc    Get all tests (for admin scheduled exams page)
 * @access  Private (Admin)
 */
router.get('/', testController.getAllTests);

/**
 * @route   GET /api/v1/tests/diagnostic/:studentEmail
 * @desc    Diagnostic endpoint to check test allocation for a student
 * @access  Private (Admin/Dev)
 */
router.get('/diagnostic/:studentEmail', testController.diagnosticCheck);

/**
 * @route   GET /api/v1/tests/:id/proctoring/participants
 * @desc    Get allocated students for proctoring view
 * @access  Private (Teacher/Admin UI)
 * NOTE: This route must come before /:id to avoid route conflicts
 */
router.get('/:id/proctoring/participants', testController.getProctoringParticipants);

/**
 * @route   GET /api/v1/tests/:id
 * @desc    Get test by ID (for student exam page)
 * @access  Private (Student)
 * NOTE: This route must come AFTER /diagnostic/:studentEmail (and any longer dynamic routes) to avoid route conflicts
 */
router.get('/:id', protect, testController.getTestById);

// Mount attempt routes (must come after /:id route to avoid conflicts)
router.use('/', attemptRoutes);

module.exports = router;

