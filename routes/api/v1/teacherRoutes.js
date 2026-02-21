const express = require('express');
const router = express.Router();
const announcementController = require('../../../controllers/announcement/announcementController');
const authMiddleware = require('../../../middleware/auth');

// All routes require teacher authentication
router.use(authMiddleware.protectTeacher);

// Announcement routes
router.get('/announcements', announcementController.getTeacherAnnouncements);
router.post('/announcements/:id/read', announcementController.markTeacherAnnouncementRead);

module.exports = router;

