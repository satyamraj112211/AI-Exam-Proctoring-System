const express = require('express');
const router = express.Router();
const systemConfigController = require('../../../../controllers/admin/systemConfigController');
// TODO: Add admin auth middleware when available

router.get('/', systemConfigController.getSystemConfig);
router.put('/', systemConfigController.updateSystemConfig);
router.post('/reset', systemConfigController.resetSystemConfig);

module.exports = router;








