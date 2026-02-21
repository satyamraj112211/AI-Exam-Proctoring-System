const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { ensureAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Role-specific dashboards
router.get(
  '/admin',
  ensureAuthenticated,
  authorizeRoles('admin'),
  dashboardController.getAdminDashboard,
);

router.get(
  '/teacher',
  ensureAuthenticated,
  authorizeRoles('teacher'),
  dashboardController.getTeacherDashboard,
);

router.get(
  '/student',
  ensureAuthenticated,
  authorizeRoles('student'),
  dashboardController.getStudentDashboard,
);

module.exports = router;



















