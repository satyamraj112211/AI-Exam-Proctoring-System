const path = require('path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// ----- View engine (EJS) -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ----- Basic middleware -----
app.use(express.urlencoded({ extended: false })); // Parse HTML form data

// ----- Session configuration -----
// In production you should:
// - Move the secret to an environment variable
// - Use a persistent store (Redis / DB) instead of default MemoryStore
app.use(
  session({
    name: 'exam.sid', // Cookie name
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
    resave: false, // Do not save session if nothing changed
    saveUninitialized: false, // Do not create empty sessions
    cookie: {
      httpOnly: true, // JS on the page cannot read the cookie
      secure: false, // Set true when behind HTTPS
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  }),
);

// Expose session user to all views so we can show/hide links easily
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// ----- Routes -----
app.use('/', authRoutes);
app.use('/', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Not Found' });
});

module.exports = app;



















