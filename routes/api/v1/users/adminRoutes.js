const express = require('express');
const router = express.Router();
const adminController = require('../../../../controllers/user/adminController');

// TODO: add admin auth middleware when available
router.get('/students', adminController.listStudentsByPath);
router.delete('/students/:id', adminController.deleteStudent);
router.get('/teachers/by-ids', adminController.getTeachersByIds);
router.get('/teachers/by-university', adminController.getTeachersByUniversity);
router.get('/universities', adminController.getUniversities);
router.delete('/teachers/:id', adminController.deleteTeacher);

module.exports = router;






