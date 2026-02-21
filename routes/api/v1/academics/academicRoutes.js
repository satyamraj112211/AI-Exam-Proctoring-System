const express = require('express');
const router = express.Router();
const academicController = require('../../../../controllers/academics/academicController');

router.get('/institutions', academicController.listInstitutions);
router.get('/institutions/:id/structure', academicController.getStructure);

module.exports = router;





















