const Announcement = require('../../models/Announcement');
const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');
const ApiResponse = require('../../utils/helpers/apiResponse');
const asyncHandler = require('../../utils/helpers/asyncHandler');
const logger = require('../../utils/helpers/logger');

/**
 * @desc    Create a new announcement
 * @route   POST /api/v1/admin/announcements
 * @access  Private (Admin)
 */
exports.createAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, targetAudience, targetType, studentFilters, teacherIds } = req.body;

  // Validation
  if (!title || !description) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Title and description are required')
    );
  }

  if (!targetAudience || !['all', 'students', 'teachers'].includes(targetAudience)) {
    return res.status(400).json(
      new ApiResponse(400, null, 'targetAudience must be one of: all, students, teachers')
    );
  }

  if (!targetType || !['all', 'specific'].includes(targetType)) {
    return res.status(400).json(
      new ApiResponse(400, null, 'targetType must be one of: all, specific')
    );
  }

  let targetStudents = [];
  let targetTeachers = [];

  // If targetType is 'specific', resolve the specific IDs
  if (targetType === 'specific') {
    if (targetAudience === 'students' || targetAudience === 'all') {
      // If studentFilters is provided and non-empty, use it; otherwise, get all students
      if (studentFilters && Array.isArray(studentFilters) && studentFilters.length > 0) {
        // Resolve student filters to student IDs
        for (const filter of studentFilters) {
          const { institutionId, branchCode, batchYear, currentYear, section } = filter;
          
          if (!institutionId || !branchCode || !batchYear || !currentYear || !section) {
            continue; // Skip invalid filters
          }

          const students = await Student.find({
            'institution.id': institutionId,
            'branch.code': branchCode.toUpperCase(),
            batchYear: Number(batchYear),
            currentYear: Number(currentYear),
            section: section.trim().toUpperCase(),
          }).select('_id');

          targetStudents.push(...students.map(s => s._id));
        }

        // Remove duplicates
        targetStudents = [...new Set(targetStudents.map(id => id.toString()))];
      } else {
        // Empty or missing studentFilters means "all students"
        const allStudents = await Student.find({}).select('_id');
        targetStudents = allStudents.map(s => s._id);
      }
    }

    if (targetAudience === 'teachers' || targetAudience === 'all') {
      // If teacherIds is provided and non-empty, use it; otherwise, get all teachers
      if (teacherIds && Array.isArray(teacherIds) && teacherIds.length > 0) {
        // Resolve teacher IDs
        const teachers = await Teacher.find({
          _id: { $in: teacherIds }
        }).select('_id');

        targetTeachers = teachers.map(t => t._id);
      } else {
        // Empty or missing teacherIds means "all teachers"
        const allTeachers = await Teacher.find({}).select('_id');
        targetTeachers = allTeachers.map(t => t._id);
      }
    }
  } else {
    // If targetType is 'all', get all students/teachers based on targetAudience
    if (targetAudience === 'students' || targetAudience === 'all') {
      const allStudents = await Student.find({}).select('_id');
      targetStudents = allStudents.map(s => s._id);
    }

    if (targetAudience === 'teachers' || targetAudience === 'all') {
      const allTeachers = await Teacher.find({}).select('_id');
      targetTeachers = allTeachers.map(t => t._id);
    }
  }

  // Create announcement
  // Store target IDs only when targetType is 'specific', otherwise store empty arrays
  // (for 'all', we don't need to store IDs as we query by targetAudience)
  const announcementData = {
    title: title.trim(),
    content: description.trim(),
    targetAudience,
    targetType,
    targetStudents: targetType === 'specific' ? targetStudents : [],
    targetTeachers: targetType === 'specific' ? targetTeachers : [],
    type: 'general',
    priority: 'medium',
    isActive: true,
    createdBy: req.admin?._id || null,
  };

  const announcement = new Announcement(announcementData);
  await announcement.save();

  logger.info(`Announcement created: ${announcement._id}, Title: ${announcement.title}, Target: ${targetAudience}, Type: ${targetType}, Students: ${targetStudents.length}, Teachers: ${targetTeachers.length}`);

  res.status(201).json(
    new ApiResponse(201, {
      announcement: {
        id: announcement._id,
        title: announcement.title,
        content: announcement.content,
        targetAudience: announcement.targetAudience,
        targetType: announcement.targetType,
        targetStudentsCount: targetStudents.length,
        targetTeachersCount: targetTeachers.length,
      }
    }, `Announcement created successfully! Sent to ${targetStudents.length} students and ${targetTeachers.length} teachers.`)
  );
});

/**
 * @desc    Get all announcements
 * @route   GET /api/v1/admin/announcements
 * @access  Private (Admin)
 */
exports.getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({})
    .sort({ createdAt: -1 })
    .select('title content targetAudience targetType targetStudents targetTeachers isActive createdAt')
    .lean();

  // Get counts for targetStudents and targetTeachers
  const announcementsWithCounts = announcements.map(ann => ({
    ...ann,
    targetStudentsCount: ann.targetStudents?.length || 0,
    targetTeachersCount: ann.targetTeachers?.length || 0,
  }));

  res.status(200).json(
    new ApiResponse(200, { announcements: announcementsWithCounts }, 'Announcements fetched successfully')
  );
});

/**
 * @desc    Get announcements for a student
 * @route   GET /api/v1/student/announcements
 * @access  Private (Student)
 */
exports.getStudentAnnouncements = asyncHandler(async (req, res) => {
  const studentId = req.user?.id || req.student?._id;

  if (!studentId) {
    return res.status(401).json(
      new ApiResponse(401, null, 'Student authentication required')
    );
  }

  // Find announcements that target this student
  // Logic: 
  // - targetAudience must be 'all' or 'students'
  // - AND (targetType is 'all' OR student is in targetStudents array)
  const announcements = await Announcement.find({
    isActive: true,
    $and: [
      {
        $or: [
          { targetAudience: 'all' },
          { targetAudience: 'students' }
        ]
      },
      {
        $or: [
          { targetType: 'all' },
          { targetType: 'specific', targetStudents: studentId }
        ]
      }
    ]
  })
    .sort({ createdAt: -1 })
    .select('title content createdAt readByStudents')
    .lean();

  // Mark which announcements are read/unread
  const announcementsWithReadStatus = announcements.map(ann => ({
    id: ann._id,
    title: ann.title,
    content: ann.content,
    createdAt: ann.createdAt,
    isRead: ann.readByStudents?.some(id => id.toString() === studentId.toString()) || false
  }));

  const unreadCount = announcementsWithReadStatus.filter(ann => !ann.isRead).length;

  res.status(200).json(
    new ApiResponse(200, {
      announcements: announcementsWithReadStatus,
      unreadCount
    }, 'Announcements fetched successfully')
  );
});

/**
 * @desc    Get announcements for a teacher
 * @route   GET /api/v1/teacher/announcements
 * @access  Private (Teacher)
 */
exports.getTeacherAnnouncements = asyncHandler(async (req, res) => {
  const teacherId = req.user?.id || req.teacher?._id;

  if (!teacherId) {
    return res.status(401).json(
      new ApiResponse(401, null, 'Teacher authentication required')
    );
  }

  // Find announcements that target this teacher
  // Logic:
  // - targetAudience must be 'all' or 'teachers'
  // - AND (targetType is 'all' OR teacher is in targetTeachers array)
  const announcements = await Announcement.find({
    isActive: true,
    $and: [
      {
        $or: [
          { targetAudience: 'all' },
          { targetAudience: 'teachers' }
        ]
      },
      {
        $or: [
          { targetType: 'all' },
          { targetType: 'specific', targetTeachers: teacherId }
        ]
      }
    ]
  })
    .sort({ createdAt: -1 })
    .select('title content createdAt readByTeachers')
    .lean();

  // Mark which announcements are read/unread
  const announcementsWithReadStatus = announcements.map(ann => ({
    id: ann._id,
    title: ann.title,
    content: ann.content,
    createdAt: ann.createdAt,
    isRead: ann.readByTeachers?.some(id => id.toString() === teacherId.toString()) || false
  }));

  const unreadCount = announcementsWithReadStatus.filter(ann => !ann.isRead).length;

  res.status(200).json(
    new ApiResponse(200, {
      announcements: announcementsWithReadStatus,
      unreadCount
    }, 'Announcements fetched successfully')
  );
});

/**
 * @desc    Mark announcement as read by student
 * @route   POST /api/v1/student/announcements/:id/read
 * @access  Private (Student)
 */
exports.markStudentAnnouncementRead = asyncHandler(async (req, res) => {
  const studentId = req.user?.id || req.student?._id;
  const { id } = req.params;

  if (!studentId) {
    return res.status(401).json(
      new ApiResponse(401, null, 'Student authentication required')
    );
  }

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Announcement not found')
    );
  }

  // Check if already read
  const isAlreadyRead = announcement.readByStudents?.some(
    id => id.toString() === studentId.toString()
  );

  if (!isAlreadyRead) {
    announcement.readByStudents = announcement.readByStudents || [];
    announcement.readByStudents.push(studentId);
    await announcement.save();
  }

  res.status(200).json(
    new ApiResponse(200, null, 'Announcement marked as read')
  );
});

/**
 * @desc    Mark announcement as read by teacher
 * @route   POST /api/v1/teacher/announcements/:id/read
 * @access  Private (Teacher)
 */
exports.markTeacherAnnouncementRead = asyncHandler(async (req, res) => {
  const teacherId = req.user?.id || req.teacher?._id;
  const { id } = req.params;

  if (!teacherId) {
    return res.status(401).json(
      new ApiResponse(401, null, 'Teacher authentication required')
    );
  }

  const announcement = await Announcement.findById(id);
  if (!announcement) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Announcement not found')
    );
  }

  // Check if already read
  const isAlreadyRead = announcement.readByTeachers?.some(
    id => id.toString() === teacherId.toString()
  );

  if (!isAlreadyRead) {
    announcement.readByTeachers = announcement.readByTeachers || [];
    announcement.readByTeachers.push(teacherId);
    await announcement.save();
  }

  res.status(200).json(
    new ApiResponse(200, null, 'Announcement marked as read')
  );
});

