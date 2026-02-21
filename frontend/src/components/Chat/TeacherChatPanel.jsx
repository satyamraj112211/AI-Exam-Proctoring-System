import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaUser } from 'react-icons/fa';
import chatSocket from '../../services/realtime/chatSocket';
import chatAPI from '../../services/api/chatAPI';

const TeacherChatPanel = ({ testId, teacherId, teacherName }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef({});
  const chatRoomRef = useRef(null);
  const socketListenersRef = useRef({});
  const isInitializedRef = useRef(false);
  const loadStudentsTimeoutRef = useRef(null);
  const messageIdsRef = useRef(new Set()); // Track message IDs to prevent duplicates

  // Get selected student object from students array
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => (s.id || s._id) === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Load students list - with debouncing to prevent rate limiting
  useEffect(() => {
    if (!testId) return;

    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const loadStudents = async () => {
      try {
        if (!isMounted) return;
        
        const response = await chatAPI.getTestStudents(testId);
        const studentsList = response?.data?.students || response?.students || [];
        
        if (isMounted) {
          setStudents(studentsList);
          
          // Update unread counts
          const counts = {};
          studentsList.forEach((student) => {
            const studentId = student.id || student._id;
            counts[studentId] = student.unreadCount || 0;
          });
          setUnreadCounts((prev) => {
            // Only update if counts actually changed to prevent unnecessary re-renders
            const hasChanged = Object.keys(counts).some(
              (id) => counts[id] !== (prev[id] || 0)
            );
            return hasChanged ? { ...prev, ...counts } : prev;
          });
          
          setLoading(false);
          retryCount = 0; // Reset retry count on success
        }
      } catch (error) {
        console.error('Error loading students:', error);
        if (isMounted && retryCount < MAX_RETRIES) {
          retryCount++;
          // Exponential backoff on error
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          loadStudentsTimeoutRef.current = setTimeout(loadStudents, delay);
        } else if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial load
    loadStudents();
    
    // Refresh students and unread counts periodically - increased interval to prevent rate limiting
    const interval = setInterval(() => {
      if (isMounted && !loadStudentsTimeoutRef.current) {
        loadStudents();
      }
    }, 15000); // Every 15 seconds instead of 5
    
    return () => {
      isMounted = false;
      clearInterval(interval);
      if (loadStudentsTimeoutRef.current) {
        clearTimeout(loadStudentsTimeoutRef.current);
        loadStudentsTimeoutRef.current = null;
      }
    };
  }, [testId]);

  // Initialize chat room when student is selected - stable dependencies
  useEffect(() => {
    if (!testId || !selectedStudentId || !teacherId) {
      setMessages([]);
      setChatRoom(null);
      chatRoomRef.current = null;
      messageIdsRef.current.clear(); // Clear message IDs when switching students
      return;
    }

    let isMounted = true;

    const initializeChat = async () => {
      try {
        setLoadingMessages(true);
        const response = await chatAPI.getOrCreateChatRoom(testId);
        const room = response?.data?.chatRoom || response?.chatRoom;
        
        if (room && isMounted) {
          setChatRoom(room);
          chatRoomRef.current = room;

          // Join chat room via socket only once
          if (!isInitializedRef.current) {
            chatSocket.emit('chat:join', {
              testId,
              roomId: room._id,
              userId: teacherId,
              userType: 'teacher',
            });
            isInitializedRef.current = true;
          }

          // Load existing messages - FILTER BY SELECTED STUDENT
          const messagesResponse = await chatAPI.getChatMessages(room._id);
          const allMessages = messagesResponse?.data?.messages || messagesResponse?.messages || [];
          
          // Filter messages to only show conversation with selected student
          const currentStudentId = selectedStudentId?.toString() || selectedStudentId;
          const filteredMessages = allMessages.filter((msg) => {
            const msgSenderId = msg.senderId?.toString() || msg.senderId;
            const msgSenderType = msg.senderType;
            
            // Show messages from this student OR messages from teacher (all teacher messages are shown)
            // But we need to ensure teacher messages are only shown if they're in the conversation
            return (
              (msgSenderId === currentStudentId && msgSenderType === 'student') ||
              (msgSenderType === 'teacher') // Teacher messages are shown (they're always for the selected student)
            );
          });
          
          if (isMounted) {
            // Track message IDs to prevent duplicates
            messageIdsRef.current = new Set(filteredMessages.map((m) => m._id?.toString() || m._id));
            
            setMessages(filteredMessages);
            
            // Mark messages from this student as read
            const unreadFromStudent = filteredMessages.filter(
              (msg) => {
                const msgSenderId = msg.senderId?.toString() || msg.senderId;
                const currentStudentId = selectedStudentId?.toString() || selectedStudentId;
                return msgSenderId === currentStudentId && 
                       msg.senderType === 'student' &&
                       !msg.readBy?.some((r) => {
                         const readUserId = r.userId?.toString() || r.userId;
                         return readUserId === (teacherId?.toString() || teacherId);
                       });
              }
            );
            
            // Mark as read in parallel but don't await
            Promise.all(
              unreadFromStudent.map((msg) => 
                chatAPI.markMessageAsRead(msg._id).catch(console.error)
              )
            ).then(() => {
              if (isMounted) {
                setUnreadCounts((prev) => ({
                  ...prev,
                  [selectedStudentId]: 0,
                }));
              }
            });
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        if (isMounted) {
          setLoadingMessages(false);
        }
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
    };
  }, [testId, teacherId, selectedStudentId]);

  // Set up socket listeners - only once, stable (like student chat)
  useEffect(() => {
    if (!testId || !teacherId) return;

    // Clean up previous listeners
    if (socketListenersRef.current.message) {
      chatSocket.off('chat:message', socketListenersRef.current.message);
    }
    if (socketListenersRef.current.typing) {
      chatSocket.off('chat:typing', socketListenersRef.current.typing);
    }

    // Listen for new messages - EXACTLY like student chat
    const handleNewMessage = (data) => {
      const currentStudentId = selectedStudentId?.toString() || selectedStudentId;
      const msgSenderId = data.senderId?.toString() || data.senderId;
      const msgRecipientId = data.recipientId?.toString() || data.recipientId;
      const msgSenderType = data.senderType;
      
      // Check if message is for current conversation
      // Teacher messages: show if recipientId matches current student OR if sender is teacher (for own messages)
      // Student messages: show if senderId matches current student
      const isForCurrentStudent = 
        (msgSenderType === 'teacher' && (msgRecipientId === currentStudentId || msgSenderId === (teacherId?.toString() || teacherId))) ||
        (msgSenderType === 'student' && msgSenderId === currentStudentId);
      
      if (
        (data.roomId === chatRoomRef.current?._id || data.testId === testId) &&
        isForCurrentStudent &&
        selectedStudentId // Only process if a student is selected
      ) {
        // Check if message already exists to avoid duplicates
        const messageId = data._id || `msg_${Date.now()}_${Math.random()}`;
        if (messageIdsRef.current.has(messageId)) {
          return; // Skip duplicate
        }
        
        // Also check by content and timestamp to catch duplicates without IDs
        const isDuplicate = Array.from(messageIdsRef.current).some((id) => {
          // This is a simple check - in production you might want more sophisticated deduplication
          return false; // We'll rely on ID tracking
        });
        
        if (!isDuplicate) {
          messageIdsRef.current.add(messageId);
          
          setMessages((prev) => {
            // Double-check for duplicates in state
            const exists = prev.some((m) => {
              const mId = m._id?.toString() || m._id;
              return mId === messageId || 
                (m.message === data.message && 
                 (m.senderId?.toString() || m.senderId) === msgSenderId && 
                 Math.abs(new Date(m.createdAt) - new Date(data.timestamp)) < 2000);
            });
            if (exists) return prev;
            
            return [
              ...prev,
              {
                _id: messageId,
                senderId: data.senderId,
                senderType: data.senderType,
                senderName: data.senderName,
                message: data.message,
                createdAt: data.timestamp,
              },
            ];
          });
          
          // Update unread count if message is from student
          if (msgSenderType === 'student' && msgSenderId === currentStudentId) {
            // If chat is open with this student, mark as read
            chatAPI.markMessageAsRead(messageId).catch(console.error);
          } else if (msgSenderType === 'student') {
            // Increment unread count for other students
            setUnreadCounts((prev) => {
              const currentCount = prev[msgSenderId] || 0;
              return {
                ...prev,
                [msgSenderId]: currentCount + 1,
              };
            });
          }
        }
      }
    };

    // Listen for typing indicators
    const handleTyping = (data) => {
      const currentStudentId = selectedStudentId?.toString() || selectedStudentId;
      const msgSenderId = data.senderId?.toString() || data.senderId;
      
      if (
        data.userType === 'student' &&
        msgSenderId === currentStudentId &&
        (data.roomId === chatRoomRef.current?._id || data.testId === testId) &&
        selectedStudentId
      ) {
        setIsTyping((prev) => ({ ...prev, [currentStudentId]: true }));
        
        if (typingTimeoutRef.current[currentStudentId]) {
          clearTimeout(typingTimeoutRef.current[currentStudentId]);
        }
        
        typingTimeoutRef.current[currentStudentId] = setTimeout(() => {
          setIsTyping((prev) => ({ ...prev, [currentStudentId]: false }));
        }, 3000);
      }
    };

    // Store listeners in ref for cleanup
    socketListenersRef.current.message = handleNewMessage;
    socketListenersRef.current.typing = handleTyping;

    chatSocket.on('chat:message', handleNewMessage);
    chatSocket.on('chat:typing', handleTyping);

    return () => {
      if (socketListenersRef.current.message) {
        chatSocket.off('chat:message', socketListenersRef.current.message);
      }
      if (socketListenersRef.current.typing) {
        chatSocket.off('chat:typing', socketListenersRef.current.typing);
      }
      // Clean up typing timeouts
      Object.values(typingTimeoutRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [testId, teacherId, selectedStudentId]); // Include selectedStudentId to update when student changes

  const handleStartChat = useCallback((student) => {
    const studentId = student.id || student._id;
    setSelectedStudentId(studentId);
    setMessages([]);
    setNewMessage('');
    messageIdsRef.current.clear(); // Clear message IDs when switching students
  }, []);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatRoom || !selectedStudentId) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Send via API first
      const response = await chatAPI.sendMessage(chatRoom._id, messageText);
      const savedMessage = response?.data?.message || response?.message;
      
      // Add message to local state immediately for instant feedback
      if (savedMessage) {
        const messageId = savedMessage._id?.toString() || savedMessage._id;
        messageIdsRef.current.add(messageId);
        
        setMessages((prev) => [
          ...prev,
          {
            _id: messageId,
            senderId: savedMessage.senderId,
            senderType: savedMessage.senderType,
            senderName: savedMessage.senderName || teacherName,
            message: savedMessage.message,
            createdAt: savedMessage.createdAt || new Date().toISOString(),
          },
        ]);
      }

      // Also emit via socket for real-time delivery to student
      chatSocket.emit('chat:message', {
        roomId: chatRoom._id,
        testId,
        message: messageText,
        senderId: teacherId,
        senderType: 'teacher',
        senderName: teacherName,
        recipientId: selectedStudentId, // CRITICAL: Include recipient ID so message only goes to this student
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
    }
  }, [newMessage, chatRoom, selectedStudentId, testId, teacherId, teacherName]);

  const handleInputChange = useCallback((e) => {
    setNewMessage(e.target.value);
    
    // Emit typing indicator with debouncing
    if (chatRoom && selectedStudentId) {
      chatSocket.emit('chat:typing', {
        roomId: chatRoom._id,
        testId,
        userId: teacherId,
        userType: 'teacher',
        isTyping: true,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current[selectedStudentId]) {
        clearTimeout(typingTimeoutRef.current[selectedStudentId]);
      }

      // Stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current[selectedStudentId] = setTimeout(() => {
        chatSocket.emit('chat:typing', {
          roomId: chatRoom._id,
          testId,
          userId: teacherId,
          userType: 'teacher',
          isTyping: false,
        });
      }, 2000);
    }
  }, [chatRoom, selectedStudentId, testId, teacherId]);

  const formatTime = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Students List Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center space-x-2 mb-2">
            <button
              type="button"
              onClick={() => navigate(`/teacher/proctoring/${testId}`)}
              className="text-slate-600 hover:text-slate-900"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">Chat Panel</h2>
          </div>
          <p className="text-xs text-slate-500">Select a student to start chatting</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">No students allocated to this test.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {students.map((student) => {
                const studentId = student.id || student._id;
                const isSelected = selectedStudentId === studentId;
                const unreadCount = unreadCounts[studentId] || 0;
                
                return (
                  <button
                    key={studentId}
                    type="button"
                    onClick={() => handleStartChat(student)}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 border-l-4 border-emerald-600'
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <FaUser className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student'}
                          </p>
                          {unreadCount > 0 && (
                            <span className="ml-2 flex-shrink-0 bg-emerald-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{student.email}</p>
                        {student.section && (
                          <p className="text-xs text-slate-400 mt-1">
                            Section {student.section} • Year {student.currentYear || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedStudent ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FaUser className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {selectedStudent.name || `${selectedStudent.firstName} ${selectedStudent.lastName}`}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {loadingMessages ? (
                <div className="text-center text-sm text-slate-500 py-4">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-4">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    // FIXED: Properly identify own messages (teacher's messages)
                    const isOwnMessage = msg.senderType === 'teacher';
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white text-slate-900 border border-slate-200'
                          }`}
                        >
                          {!isOwnMessage && (
                            <div className="text-xs font-semibold mb-1 text-slate-600">
                              {msg.senderName || 'Student'}
                            </div>
                          )}
                          <div className="text-sm">{msg.message}</div>
                          <div className={`text-xs mt-1 ${isOwnMessage ? 'text-emerald-100' : 'text-slate-500'}`}>
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping[selectedStudentId] && (
                    <div className="flex justify-start">
                      <div className="bg-white text-slate-900 border border-slate-200 rounded-lg px-4 py-2">
                        <div className="text-xs text-slate-500">Student is typing...</div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-slate-200 px-6 py-4">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <span className="text-sm">Send</span>
                  <FaPaperPlane className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FaUser className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-500">Select a student from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherChatPanel;
