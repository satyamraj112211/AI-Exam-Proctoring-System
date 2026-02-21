const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    participants: {
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
      },
      students: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
chatRoomSchema.index({ testId: 1, isActive: 1 });
chatRoomSchema.index({ 'participants.teacher': 1 });
chatRoomSchema.index({ 'participants.students': 1 });

// Static method to find or create chat room for a test
chatRoomSchema.statics.findOrCreateForTest = async function (testId, teacherId, studentIds = []) {
  let room = await this.findOne({ testId, isActive: true }).populate('participants.teacher', 'name email');
  
  if (!room) {
    room = await this.create({
      testId,
      participants: {
        teacher: teacherId,
        students: studentIds,
      },
      isActive: true,
    });
    await room.populate('participants.teacher', 'name email');
  } else {
    // Update students list if new students are added
    if (studentIds.length > 0) {
      const existingStudents = room.participants.students.map((s) => s.toString());
      const newStudents = studentIds.filter((sid) => !existingStudents.includes(sid.toString()));
      if (newStudents.length > 0) {
        room.participants.students.push(...newStudents);
        await room.save();
      }
    }
  }
  
  return room;
};

module.exports = mongoose.model('ChatRoom', chatRoomSchema);








