const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');
const Attempt = require('../../models/Attempt');
const Test = require('../../models/Test');
const ApiResponse = require('../../utils/helpers/apiResponse');
const asyncHandler = require('../../utils/helpers/asyncHandler');

// GET /api/v1/admin/students
// Query by institution -> branch -> year -> section
exports.listStudentsByPath = asyncHandler(async (req, res) => {
  const { institutionId, branchCode, batchYear, currentYear, section } = req.query;

  if (!institutionId || !branchCode || !batchYear || !currentYear || !section) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'institutionId, branchCode, batchYear, currentYear, and section are required'));
  }

  const filter = {
    'institution.id': institutionId,
    'branch.code': branchCode.toUpperCase(),
    batchYear: Number(batchYear),
    currentYear: Number(currentYear),
    section: section.trim().toUpperCase(),
  };

  const students = await Student.find(filter).select(
    '_id firstName lastName email institution branch batchYear currentYear section',
  );

  res
    .status(200)
    .json(new ApiResponse(200, { count: students.length, students }, 'Students fetched'));
});

// GET /api/v1/admin/teachers/by-ids
// Get teacher details by teacher IDs
exports.getTeachersByIds = asyncHandler(async (req, res) => {
  const { teacherIds } = req.query;

  if (!teacherIds) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'teacherIds query parameter is required (comma-separated)'));
  }

  const ids = Array.isArray(teacherIds) 
    ? teacherIds 
    : teacherIds.split(',').map(id => id.trim().toUpperCase());

  const Teacher = require('../../models/Teacher');
  const teachers = await Teacher.find({ 
    teacherId: { $in: ids } 
  }).select('_id teacherId firstName lastName email university');

  res
    .status(200)
    .json(new ApiResponse(200, { count: teachers.length, teachers }, 'Teachers fetched'));
});

// GET /api/v1/admin/teachers/by-university
// Query teachers by university name (case-insensitive exact or partial match)
exports.getTeachersByUniversity = asyncHandler(async (req, res) => {
  const { university } = req.query;

  if (!university || !university.trim()) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'university query parameter is required'));
  }

  const searchTerm = university.trim();
  
  // Escape special regex characters
  const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Try exact match first (case-insensitive)
  const exactRegex = new RegExp(`^${escapedSearch}$`, 'i');
  let teachers = await Teacher.find({ university: exactRegex })
    .select('_id teacherId firstName lastName email university department')
    .sort({ lastName: 1, firstName: 1 })
    .lean();

  // If no exact match, try partial match (contains the search term)
  if (teachers.length === 0) {
    const partialRegex = new RegExp(escapedSearch, 'i');
    teachers = await Teacher.find({ university: partialRegex })
      .select('_id teacherId firstName lastName email university department')
      .sort({ lastName: 1, firstName: 1 })
      .lean();
  }
  
  // If still no results, try a more flexible search (word boundary matching)
  if (teachers.length === 0) {
    // Split search term into words and search for each
    const words = searchTerm.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 0) {
      const wordRegexes = words.map(word => 
        new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      );
      // Find teachers where university matches all words
      const allTeachers = await Teacher.find({})
        .select('_id teacherId firstName lastName email university department')
        .lean();
      
      teachers = allTeachers.filter(teacher => {
        const uni = (teacher.university || '').toLowerCase();
        return wordRegexes.every(regex => regex.test(uni));
      });
    }
  }

  res
    .status(200)
    .json(new ApiResponse(200, { count: teachers.length, teachers }, 'Teachers fetched'));
});

// GET /api/v1/admin/universities
// Get all unique universities/colleges for autocomplete
exports.getUniversities = asyncHandler(async (req, res) => {
  const { search } = req.query;
  
  // Get all unique universities from the database using distinct
  const allUniversities = await Teacher.distinct('university');
  
  // Filter and clean universities
  let universities = allUniversities
    .filter(uni => uni && typeof uni === 'string' && uni.trim().length > 0)
    .map(uni => uni.trim())
    .filter((uni, index, self) => self.indexOf(uni) === index) // Remove duplicates
    .sort();

  // If search term provided, filter by it (case-insensitive)
  if (search && search.trim()) {
    const searchLower = search.trim().toLowerCase();
    universities = universities.filter(uni => 
      uni.toLowerCase().includes(searchLower)
    );
  }

  res
    .status(200)
    .json(new ApiResponse(200, { universities }, 'Universities fetched'));
});

// DELETE /api/v1/admin/students/:id
// Delete a student and all their related data (attempts)
exports.deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Student ID is required'));
  }

  // Check if student exists
  const student = await Student.findById(id);
  if (!student) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, 'Student not found'));
  }

  // Delete all attempts by this student
  await Attempt.deleteMany({ student: id });

  // Delete the student
  await Student.findByIdAndDelete(id);

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Student and all related data deleted successfully'));
});

// DELETE /api/v1/admin/teachers/:id
// Delete a teacher and all their related data (tests and attempts for those tests)
exports.deleteTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, 'Teacher ID is required'));
  }

  // Check if teacher exists
  const teacher = await Teacher.findById(id);
  if (!teacher) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, 'Teacher not found'));
  }

  // Find all tests created by this teacher
  const tests = await Test.find({ teacher: id });
  const testIds = tests.map(test => test._id);

  // Delete all attempts for tests created by this teacher
  if (testIds.length > 0) {
    await Attempt.deleteMany({ test: { $in: testIds } });
  }

  // Delete all tests created by this teacher
  await Test.deleteMany({ teacher: id });

  // Delete the teacher
  await Teacher.findByIdAndDelete(id);

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Teacher and all related data deleted successfully'));
});

