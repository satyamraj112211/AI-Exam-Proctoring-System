const bcrypt = require('bcrypt');
const { findByEmail } = require('../data/users');

/**
 * Show the public homepage.
 * If the user is already logged in, they will be redirected by middleware.
 */
exports.getHome = (req, res) => {
  res.render('home', { title: 'Home', error: null });
};

/**
 * Show the login form.
 * If the user is already logged in, they will be redirected by middleware.
 */
exports.getLogin = (req, res) => {
  res.render('login', { title: 'Login', error: null });
};

/**
 * Handle POST /login
 * - Look up the user by email in our in-memory array
 * - Compare password with bcrypt
 * - On success: store { id, email, role } in the session and redirect
 *   to the appropriate role dashboard.
 */
exports.postLogin = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).render('login', {
      title: 'Login',
      error: 'Email and password are required.',
    });
  }

  const user = findByEmail(email);
  if (!user) {
    return res.status(401).render('login', {
      title: 'Login',
      error: 'Invalid email or password.',
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).render('login', {
      title: 'Login',
      error: 'Invalid email or password.',
    });
  }

  // At this point, authentication succeeded.
  // Session-based authentication: we store a minimal user object in the session.
  req.session.user = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  // Session is tied to this browser profile via the session cookie.
  // Refreshes and new tabs in the same profile will reuse the same session
  // until the user logs out or the session expires.

  if (user.role === 'admin') return res.redirect('/admin');
  if (user.role === 'teacher') return res.redirect('/teacher');
  if (user.role === 'student') return res.redirect('/student');

  // Fallback: unknown role – log out and show error
  req.session.destroy(() => {
    res.status(500).render('login', {
      title: 'Login',
      error: 'User role is not recognized. Contact support.',
    });
  });
};

/**
 * Handle POST /logout
 * - Destroy the session
 * - Redirect back to the homepage
 */
exports.postLogout = (req, res) => {
  if (!req.session) {
    return res.redirect('/');
  }

  req.session.destroy((err) => {
    if (err) {
      // If something goes wrong destroying the session, clear the cookie anyway.
      res.clearCookie('exam.sid');
      return res.redirect('/');
    }

    // Clear the session cookie for this browser profile.
    res.clearCookie('exam.sid');
    return res.redirect('/');
  });
};



















