const express = require('express');
const router = express.Router();
const statsController = require('../../../controllers/analytics/statsController');

// Public routes
router.get('/home', statsController.getHomeStats);
router.get('/analytics', statsController.getPlatformAnalytics);
router.get('/live', statsController.getLiveStats);

module.exports = router;