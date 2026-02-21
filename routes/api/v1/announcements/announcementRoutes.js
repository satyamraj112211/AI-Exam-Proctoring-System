const express = require('express');
const router = express.Router();
const announcementController = require('../../../../controllers/announcement/announcementController');

// TODO: add admin auth middleware when available
router.post('/', announcementController.createAnnouncement);
router.get('/', announcementController.getAnnouncements);

module.exports = router;

