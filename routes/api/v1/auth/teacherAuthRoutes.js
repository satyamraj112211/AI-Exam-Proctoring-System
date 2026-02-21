const express = require('express');
const router = express.Router();
const teacherAuthController = require('../../../../controllers/auth/teacherAuthController');
const authMiddleware = require('../../../../middleware/auth');
const validate = require('../../../../middleware/validation/teacherValidation');

// Public routes
router.post('/send-otp', validate.sendOTP, teacherAuthController.sendOTP);
router.post('/verify-otp', validate.verifyOTP, teacherAuthController.verifyOTP);
router.post('/register', validate.register, teacherAuthController.register);
router.post('/login', validate.login, teacherAuthController.login);
router.post('/forgot-password', teacherAuthController.forgotPassword);
router.post('/verify-reset-otp', teacherAuthController.verifyResetOTP);
router.post('/reset-password', teacherAuthController.resetPassword);

module.exports = router;