/**
 * Authentication + Authorization middleware.
 *
 * We use session-based auth. When a user logs in successfully, we store
 * a small user object on req.session.user:
 *   { id, email, role }
 *
 * That session is backed by a browser cookie, which keeps the user logged in
 * across page refreshes and tabs in that browser profile until logout.
 */

/**
 * Require that the user is authenticated.
 * If not logged in, redirect to the homepage.
 */
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/');
}

/**
 * If the user is already logged in, redirect them away from pages like
 * the homepage or login form to their role-specific dashboard.
 */
function redirectIfAuthenticated(req, res, next) {
  if (!req.session || !req.session.user) {
    return next();
  }

  const { role } = req.session.user;
  if (role === 'admin') return res.redirect('/admin');
  if (role === 'teacher') return res.redirect('/teacher');
  if (role === 'student') return res.redirect('/student');

  // Unknown role, treat as unauthenticated
  return next();
}

/**
 * Role-based authorization middleware.
 * Usage: authorizeRoles('admin'), authorizeRoles('teacher', 'admin'), etc.
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const user = req.session && req.session.user;
    if (!user) {
      return res.redirect('/');
    }

    if (!allowedRoles.includes(user.role)) {
      // Forbidden – user is logged in but does not have the required role.
      return res.status(403).render('403', {
        title: 'Forbidden',
        requiredRoles: allowedRoles,
      });
    }

    return next();
  };
}

module.exports = {
  ensureAuthenticated,
  redirectIfAuthenticated,
  authorizeRoles,
};



















