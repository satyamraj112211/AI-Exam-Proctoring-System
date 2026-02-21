const ChatRoom = require('../../models/ChatRoom');
const ChatMessage = require('../../models/ChatMessage');
const Test = require('../../models/Test');
const Student = require('../../models/Student');
const Teacher = require('../../models/Teacher');
const ApiResponse = require('../../utils/helpers/apiResponse');
const asyncHandler = require('../../utils/helpers/asyncHandler');
const logger = require('../../utils/helpers/logger');

/**
 * @desc    Get or create chat room for a test
 * @route   GET /api/v1/chat/room/:testId
 * @access  Private (Student/Teacher)
 */
exports.getOrCreateChatRoom = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const userId = req.user?.id || req.teacher?._id;
  const userType = req.user ? 'student' : 'teacher';

  // Verify test exists
  const test = await Test.findById(testId);
  if (!test) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Test not found')
    );
  }

  // Get teacher (test owner)
  const teacherId = test.teacher || test.createdBy;
  if (!teacherId) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Teacher not found for this test')
    );
  }
  
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Teacher not found for this test')
    );
  }

  // Get all students allocated to this test
  const students = await Student.find({ _id: { $in: test.allowedStudents || [] } });
  const studentIds = students.map((s) => s._id);

  // Find or create chat room
  const chatRoom = await ChatRoom.findOrCreateForTest(testId, teacher._id, studentIds);
  await chatRoom.populate('participants.students', 'name email branch section currentYear');

  res.status(200).json(
    new ApiResponse(200, { chatRoom }, 'Chat room retrieved successfully')
  );
});

/**
 * @desc    Get chat messages for a room
 * @route   GET /api/v1/chat/room/:roomId/messages
 * @access  Private (Student/Teacher)
 */
exports.getChatMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user?.id || req.teacher?._id;

  // Verify user has access to this chat room
  const chatRoom = await ChatRoom.findById(roomId);
  if (!chatRoom) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Chat room not found')
    );
  }

  // Check if user is a participant
  const isTeacher = req.teacher && chatRoom.participants.teacher.toString() === req.teacher._id.toString();
  const isStudent = req.user && chatRoom.participants.students.some(
    (sid) => sid.toString() === req.user.id.toString()
  );

  if (!isTeacher && !isStudent) {
    return res.status(403).json(
      new ApiResponse(403, null, 'Access denied to this chat room')
    );
  }

  // Fetch messages with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const messages = await ChatMessage.find({ chatRoomId: roomId })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  // Reverse to show oldest first
  messages.reverse();

  res.status(200).json(
    new ApiResponse(200, { messages }, 'Messages retrieved successfully')
  );
});

/**
 * @desc    Send a chat message
 * @route   POST /api/v1/chat/message
 * @access  Private (Student/Teacher)
 */
exports.sendMessage = asyncHandler(async (req, res) => {
  const { chatRoomId, message } = req.body;
  const userId = req.user?.id || req.teacher?._id;
  const userType = req.user ? 'student' : 'teacher';

  if (!chatRoomId || !message || !message.trim()) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Chat room ID and message are required')
    );
  }

  // Verify chat room exists
  const chatRoom = await ChatRoom.findById(chatRoomId);
  if (!chatRoom) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Chat room not found')
    );
  }

  // Verify user is a participant
  const isTeacher = req.teacher && chatRoom.participants.teacher.toString() === req.teacher._id.toString();
  const isStudent = req.user && chatRoom.participants.students.some(
    (sid) => sid.toString() === req.user.id.toString()
  );

  if (!isTeacher && !isStudent) {
    return res.status(403).json(
      new ApiResponse(403, null, 'Access denied to this chat room')
    );
  }

  // Get sender name
  let senderName = '';
  if (userType === 'teacher') {
    const teacher = await Teacher.findById(userId);
    senderName = teacher?.name || 'Teacher';
  } else {
    const student = await Student.findById(userId);
    senderName = student?.name || 'Student';
  }

  // Create message
  const chatMessage = await ChatMessage.create({
    chatRoomId,
    senderId: userId,
    senderType: userType,
    senderName,
    message: message.trim(),
  });

  logger.info(`Chat message sent: ${chatMessage._id} by ${userType} ${userId} in room ${chatRoomId}`);

  res.status(201).json(
    new ApiResponse(201, { message: chatMessage }, 'Message sent successfully')
  );
});

/**
 * @desc    Mark message as read
 * @route   POST /api/v1/chat/message/:messageId/read
 * @access  Private (Student/Teacher)
 */
exports.markMessageAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user?.id || req.teacher?._id;

  const message = await ChatMessage.findById(messageId);
  if (!message) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Message not found')
    );
  }

  // Check if already read by this user
  const alreadyRead = message.readBy.some(
    (r) => r.userId.toString() === userId.toString()
  );

  if (!alreadyRead) {
    message.readBy.push({
      userId,
      readAt: new Date(),
    });
    message.isRead = true;
    await message.save();
  }

  res.status(200).json(
    new ApiResponse(200, { message }, 'Message marked as read')
  );
});

/**
 * @desc    Get students list for teacher chat panel with unread counts
 * @route   GET /api/v1/chat/test/:testId/students
 * @access  Private (Teacher)
 */
exports.getTestStudents = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const teacherId = req.teacher._id;

  if (!req.teacher) {
    return res.status(403).json(
      new ApiResponse(403, null, 'Only teachers can access this endpoint')
    );
  }

  // Verify test exists
  const test = await Test.findById(testId).populate('allowedStudents', 'name email branch section currentYear batchYear firstName lastName');
  if (!test) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Test not found')
    );
  }

  // Get or create chat room
  const chatRoom = await ChatRoom.findOne({ testId, isActive: true });
  
  // Get unread message counts for each student
  const studentsWithUnread = await Promise.all(
    (test.allowedStudents || []).map(async (student) => {
      let unreadCount = 0;
      if (chatRoom) {
        // Count unread messages from this student to the teacher
        unreadCount = await ChatMessage.countDocuments({
          chatRoomId: chatRoom._id,
          senderId: student._id,
          senderType: 'student',
          readBy: { $not: { $elemMatch: { userId: teacherId } } },
        });
      }
      
      return {
        ...student.toObject(),
        id: student._id,
        name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student',
        unreadCount,
      };
    })
  );

  res.status(200).json(
    new ApiResponse(200, { students: studentsWithUnread }, 'Students retrieved successfully')
  );
});

