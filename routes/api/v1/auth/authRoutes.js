const express = require('express');
const router = express.Router();
const authController = require('../../../../controllers/auth/authController.js');

// Public routes
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.get('/universities', authController.getUniversities);
router.post('/register', authController.registerStudent);
router.post('/login', authController.loginStudent);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOTP);
router.post('/reset-password', authController.resetPassword);

module.exports = router;