import React, { useEffect, useRef, useState } from 'react';
import { FaPaperPlane, FaComments } from 'react-icons/fa';
import chatSocket from '../../services/realtime/chatSocket';
import chatAPI from '../../services/api/chatAPI';

const StudentChat = ({ testId, studentId, studentName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatRoomRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat room and load messages - only when chat is opened
  useEffect(() => {
    if (!testId || !studentId || !isOpen) return;

    let isMounted = true;

    const initializeChat = async () => {
      try {
        setLoading(true);
        const response = await chatAPI.getOrCreateChatRoom(testId);
        const room = response?.data?.chatRoom || response?.chatRoom;
        
        if (room && isMounted) {
          setChatRoom(room);
          chatRoomRef.current = room;

          // Join chat room via socket
          chatSocket.emit('chat:join', {
            testId,
            roomId: room._id,
            userId: studentId,
            userType: 'student',
          });

          // Load existing messages
          const messagesResponse = await chatAPI.getChatMessages(room._id);
          const loadedMessages = messagesResponse?.data?.messages || messagesResponse?.messages || [];
          
          if (isMounted) {
            setMessages(loadedMessages);
            
            // Count unread messages and mark as read
            const unread = loadedMessages.filter(
              (msg) => msg.senderType === 'teacher' && 
                       !msg.readBy?.some((r) => r.userId?.toString() === studentId?.toString())
            );
            
            setUnreadCount(unread.length);
            
            // Mark all unread messages as read
            for (const msg of unread) {
              await chatAPI.markMessageAsRead(msg._id).catch(console.error);
            }
            setUnreadCount(0);
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
    };
  }, [testId, studentId, isOpen]);

  // Set up socket listeners separately - always active to receive messages even when closed
  useEffect(() => {
    if (!testId || !studentId) return;

    // Listen for new messages
    const handleNewMessage = (data) => {
      // Only show messages intended for this student or from this student
      const isForThisStudent = 
        (data.recipientId === studentId || data.recipientId?.toString() === studentId?.toString()) ||
        (data.senderId === studentId || data.senderId?.toString() === studentId?.toString());
      
      if (
        (data.roomId === chatRoomRef.current?._id || data.testId === testId) &&
        isForThisStudent
      ) {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some((m) => 
            m._id === data._id || 
            (m.message === data.message && 
             m.senderId === data.senderId && 
             Math.abs(new Date(m.createdAt) - new Date(data.timestamp)) < 1000)
          );
          if (exists) return prev;
          
          return [
            ...prev,
            {
              _id: data._id || Date.now().toString(),
              senderId: data.senderId,
              senderType: data.senderType,
              senderName: data.senderName,
              message: data.message,
              createdAt: data.timestamp,
            },
          ];
        });
        
        // Update unread count if message is from teacher and chat is closed
        if (data.senderType === 'teacher') {
          setUnreadCount((prev) => {
            if (!isOpen) {
              return prev + 1;
            } else {
              // Mark as read immediately if chat is open
              chatAPI.markMessageAsRead(data._id || Date.now().toString()).catch(console.error);
              return prev;
            }
          });
        }
      }
    };

    // Listen for typing indicators
    const handleTyping = (data) => {
      if (data.userType === 'teacher' && (data.roomId === chatRoomRef.current?._id || data.testId === testId)) {
        setIsTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };

    chatSocket.on('chat:message', handleNewMessage);
    chatSocket.on('chat:typing', handleTyping);

    return () => {
      chatSocket.off('chat:message', handleNewMessage);
      chatSocket.off('chat:typing', handleTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [testId, studentId, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatRoom) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Send via API
      await chatAPI.sendMessage(chatRoom._id, messageText);

      // Also emit via socket for real-time delivery
      chatSocket.emit('chat:message', {
        roomId: chatRoom._id,
        testId,
        message: messageText,
        senderId: studentId,
        senderType: 'student',
        senderName: studentName,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Emit typing indicator
    if (chatRoom) {
      chatSocket.emit('chat:typing', {
        roomId: chatRoom._id,
        testId,
        userId: studentId,
        userType: 'student',
        isTyping: true,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        chatSocket.emit('chat:typing', {
          roomId: chatRoom._id,
          testId,
          userId: studentId,
          userType: 'student',
          isTyping: false,
        });
      }, 2000);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Mark messages as read when opening chat
  const handleOpenChat = async () => {
    setIsOpen(true);
    
    // Mark all unread messages as read when opening
    if (chatRoomRef.current && unreadCount > 0) {
      try {
        const messagesResponse = await chatAPI.getChatMessages(chatRoomRef.current._id);
        const allMessages = messagesResponse?.data?.messages || messagesResponse?.messages || [];
        const unreadMessages = allMessages.filter(
          (msg) => msg.senderType === 'teacher' && 
                   !msg.readBy?.some((r) => r.userId?.toString() === studentId?.toString())
        );
        
        for (const msg of unreadMessages) {
          await chatAPI.markMessageAsRead(msg._id).catch(console.error);
        }
        setUnreadCount(0);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleOpenChat}
        className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center relative"
        title="Open Chat"
      >
        <FaComments className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Chat with Teacher</h3>
          <p className="text-xs text-emerald-100">Real-time support</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-emerald-100 text-lg font-bold"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {loading ? (
          <div className="text-center text-sm text-slate-500 py-4">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-4">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.senderType === 'student';
            return (
              <div
                key={msg._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isOwnMessage
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                >
                  {!isOwnMessage && (
                    <div className="text-xs font-semibold mb-1 text-slate-600">
                      {msg.senderName}
                    </div>
                  )}
                  <div className="text-sm">{msg.message}</div>
                  <div className={`text-xs mt-1 ${isOwnMessage ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2">
              <div className="text-xs text-slate-500">Teacher is typing...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-3 bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaPaperPlane className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentChat;


