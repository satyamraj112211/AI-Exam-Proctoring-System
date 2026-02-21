const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    senderType: {
      type: String,
      enum: ['teacher', 'student'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
chatMessageSchema.index({ chatRoomId: 1, createdAt: -1 });
chatMessageSchema.index({ senderId: 1, senderType: 1 });

// Pre-save hook to update chat room's lastMessageAt
chatMessageSchema.pre('save', async function (next) {
  if (this.isNew) {
    const ChatRoom = mongoose.model('ChatRoom');
    await ChatRoom.findByIdAndUpdate(this.chatRoomId, {
      lastMessageAt: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);


