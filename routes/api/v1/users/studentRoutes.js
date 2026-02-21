const express = require('express');
const router = express.Router();
const { protect } = require('../../../../middleware/auth.js');
const studentController = require('../../../../controllers/user/studentController');
const { avatarUpload } = require('../../../../middleware/upload');

// All routes below require authentication
router.use(protect);

// Get current student profile
router.get('/profile', studentController.getProfile);

// Update current student profile (including optional avatar image)
router.put(
  '/profile',
  avatarUpload.single('profileImage'),
  studentController.updateProfile
);

module.exports = router;