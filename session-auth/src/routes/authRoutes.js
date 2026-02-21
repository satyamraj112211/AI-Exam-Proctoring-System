const express = require('express');
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

// Public homepage – if already logged in, redirect to dashboard
router.get('/', redirectIfAuthenticated, authController.getHome);

// Login page – if already logged in, redirect to dashboard
router.get('/login', redirectIfAuthenticated, authController.getLogin);

// Handle login submission
router.post('/login', redirectIfAuthenticated, authController.postLogin);

// Handle logout (POST to avoid accidental logouts via links)
router.post('/logout', authController.postLogout);

module.exports = router;



















