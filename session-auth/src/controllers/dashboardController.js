/**
 * Simple controllers that render role-specific dashboards.
 * At this point the user is already authenticated and authorized
 * by the middleware stack on each route.
 */

exports.getAdminDashboard = (req, res) => {
  res.render('admin-dashboard', {
    title: 'Admin Dashboard',
  });
};

exports.getTeacherDashboard = (req, res) => {
  res.render('teacher-dashboard', {
    title: 'Teacher Dashboard',
  });
};

exports.getStudentDashboard = (req, res) => {
  res.render('student-dashboard', {
    title: 'Student Dashboard',
  });
};



















