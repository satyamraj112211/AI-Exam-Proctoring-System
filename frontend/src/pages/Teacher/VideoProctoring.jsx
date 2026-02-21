import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import { teacherAuthAPI } from '../../services/api/authAPI';
import chatAPI from '../../services/api/chatAPI';
import screenSocket from '../../services/realtime/screenSocket';

const VideoProctoring = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [studentStreams, setStudentStreams] = useState({});
  const [studentAudioEnabled, setStudentAudioEnabled] = useState({});
  const [focusedStudentId, setFocusedStudentId] = useState(null);
  const peerConnectionsRef = useRef({});
  const videoRefsRef = useRef({});
  const audioRefsRef = useRef({});
  const focusedVideoRef = useRef(null);
  const focusedAudioRef = useRef(null);
  const socketInitializedRef = useRef(false);
  const connectionsInitializedRef = useRef(false);

  // Load students
  useEffect(() => {
    if (!teacherAuthAPI.isAuthenticated()) {
      navigate('/auth/teacher-login', { replace: true });
      return;
    }

    const loadStudents = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await chatAPI.getTestStudents(testId);
        const studentsList = response?.data?.students || response?.students || [];
        setStudents(studentsList);
        
        // Set first student as focused by default
        if (studentsList.length > 0 && !focusedStudentId) {
          const firstStudentId = studentsList[0].id || studentsList[0]._id;
          setFocusedStudentId(firstStudentId);
        }
      } catch (e) {
        console.error('Failed to load students:', e);
        setError(e?.response?.data?.message || e?.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [navigate, testId]);

  // Reset initialization flags on unmount to allow reconnection on reload
  useEffect(() => {
    return () => {
      // On unmount, reset flags so reconnection can happen on reload
      console.log('[TEACHER] Component unmounting, resetting connection flags');
      connectionsInitializedRef.current = false;
      // Keep socketInitializedRef as true since socket persists
    };
  }, []);

  // Initialize socket connection and join room
  useEffect(() => {
    if (!testId || socketInitializedRef.current) return;

    const teacherId = teacherAuthAPI.getCurrentTeacher()?._id || teacherAuthAPI.getCurrentTeacher()?.id;
    if (!teacherId) return;

    console.log('[TEACHER] 🔌 Initializing socket connection...');

    const initializeSocket = async () => {
      try {
        // Connect socket if not connected
        if (!screenSocket.connected) {
          console.log('[TEACHER] Connecting socket...');
          screenSocket.connect();
          
          // Wait for connection
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Socket connection timeout'));
            }, 5000);
            
            if (screenSocket.connected) {
              clearTimeout(timeout);
              resolve();
            } else {
              screenSocket.once('connect', () => {
                clearTimeout(timeout);
                resolve();
              });
              screenSocket.once('connect_error', (err) => {
                clearTimeout(timeout);
                reject(err);
              });
            }
          });
        }
        
        console.log('[TEACHER] ✅ Socket connected');
        
        // Join video proctoring room
        screenSocket.emit('video-proctoring:join', {
          testId,
          teacherId,
          role: 'teacher',
        });
        
        console.log('[TEACHER] ✅ Joined video proctoring room');
        socketInitializedRef.current = true;
        
        // After joining, check if we need to reconnect to existing students
        setTimeout(() => {
          const teacherIdCheck = teacherAuthAPI.getCurrentTeacher()?._id || teacherAuthAPI.getCurrentTeacher()?.id;
          if (teacherIdCheck && students.length > 0) {
            console.log('[TEACHER] 🔄 Checking for existing students to reconnect after reload...');
            students.forEach((student, index) => {
              const studentId = student.id || student._id;
              const existingPc = peerConnectionsRef.current[studentId];
              
              // If no connection or connection is dead, reconnect
              if (!existingPc || existingPc.connectionState === 'closed' || existingPc.connectionState === 'failed' || existingPc.connectionState === 'disconnected') {
                if (existingPc) {
                  console.log(`[TEACHER] Closing dead connection for ${studentId}`);
                  existingPc.close();
                  delete peerConnectionsRef.current[studentId];
                }
                
                console.log(`[TEACHER] Reconnecting to student ${studentId}...`);
                setTimeout(() => {
                  createPeerConnection(studentId, teacherIdCheck);
                }, 1000 * (index + 1));
              } else {
                console.log(`[TEACHER] Connection already active for ${studentId} (state: ${existingPc.connectionState})`);
              }
            });
          }
        }, 2000);
      } catch (err) {
        console.error('[TEACHER] ❌ Failed to initialize socket:', err);
        setError('Failed to connect to video proctoring service');
      }
    };

    initializeSocket();
  }, [testId, students]);

  // Initialize WebRTC connections when students are loaded
  useEffect(() => {
    if (!testId || students.length === 0 || !socketInitializedRef.current) {
      console.log('[TEACHER] Waiting for prerequisites:', {
        testId: !!testId,
        studentsCount: students.length,
        socketInitialized: socketInitializedRef.current,
      });
      return;
    }

    const teacherId = teacherAuthAPI.getCurrentTeacher()?._id || teacherAuthAPI.getCurrentTeacher()?.id;
    if (!teacherId) return;

    // If connections were already initialized, check if we need to reconnect
    if (connectionsInitializedRef.current) {
      console.log('[TEACHER] Connections initialized, checking for missing connections...');
      
      // Check which students don't have active connections
      students.forEach((student) => {
        const studentId = student.id || student._id;
        const pc = peerConnectionsRef.current[studentId];
        
        if (!pc || pc.connectionState === 'closed' || pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.log(`[TEACHER] Reconnecting to student ${studentId} (state: ${pc?.connectionState || 'none'})`);
          if (pc) {
            pc.close();
            delete peerConnectionsRef.current[studentId];
          }
          // Remove stream from state if connection is dead
          setStudentStreams(prev => {
            const updated = { ...prev };
            delete updated[studentId];
            return updated;
          });
          
          // Reconnect after a short delay
          setTimeout(() => {
            createPeerConnection(studentId, teacherId);
          }, 1000);
        }
      });
      
      return;
    }

    console.log('[TEACHER] 🚀 Initializing WebRTC connections', {
      testId,
      teacherId,
      studentsCount: students.length,
      studentIds: students.map(s => s.id || s._id),
    });

    connectionsInitializedRef.current = true;

    // Set up socket listeners
    const handleAnswer = async ({ answer, studentId }) => {
      console.log(`[TEACHER] 📥 RECEIVED ANSWER from student ${studentId}`, {
        answerType: answer?.type,
        hasAnswer: !!answer,
      });
      
      const pc = peerConnectionsRef.current[studentId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log(`[TEACHER] ✅ Remote description set for student ${studentId}`);
          console.log(`[TEACHER] Connection state: ${pc.connectionState}, ICE state: ${pc.iceConnectionState}`);
        } catch (err) {
          console.error(`[TEACHER] ❌ Error setting remote description:`, err);
        }
      } else {
        console.error(`[TEACHER] ❌ No peer connection for student ${studentId}`);
      }
    };

    const handleIceCandidate = ({ candidate, studentId }) => {
      console.log(`[TEACHER] 📥 ICE candidate from student ${studentId}`);
      const pc = peerConnectionsRef.current[studentId];
      if (pc && candidate) {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
          console.error(`[TEACHER] Error adding ICE candidate:`, err);
        });
      }
    };

    const handleStudentJoined = ({ studentId }) => {
      console.log(`[TEACHER] 🎉 Student ${studentId} joined room`);
      if (teacherId) {
        const existingPc = peerConnectionsRef.current[studentId];
        
        // If no connection or connection is dead, create new one
        if (!existingPc || existingPc.connectionState === 'closed' || existingPc.connectionState === 'failed' || existingPc.connectionState === 'disconnected') {
          if (existingPc) {
            console.log(`[TEACHER] Closing dead connection for ${studentId}`);
            existingPc.close();
            delete peerConnectionsRef.current[studentId];
          }
          
          setTimeout(() => {
            console.log(`[TEACHER] Creating connection for student ${studentId}`);
            createPeerConnection(studentId, teacherId);
          }, 2000);
        } else {
          console.log(`[TEACHER] Connection already exists for student ${studentId} (state: ${existingPc.connectionState})`);
        }
      }
    };

    screenSocket.on('video-proctoring:answer', handleAnswer);
    screenSocket.on('video-proctoring:ice-candidate', handleIceCandidate);
    screenSocket.on('video-proctoring:student-joined', handleStudentJoined);

    // Create peer connections for all students
    const initConnections = () => {
      console.log('[TEACHER] Creating peer connections for students...');
      students.forEach((student, index) => {
        const studentId = student.id || student._id;
        setTimeout(() => {
          console.log(`[TEACHER] Creating connection for student ${studentId} (${index + 1}/${students.length})`);
          createPeerConnection(studentId, teacherId);
        }, 1000 * (index + 1)); // Stagger: 1s, 2s, 3s...
      });
    };

    // Wait a bit for students to be ready, then initialize connections
    const timeout = setTimeout(initConnections, 3000);

    return () => {
      clearTimeout(timeout);
      // Don't remove listeners on cleanup - we want them to persist for reconnections
      // screenSocket.off('video-proctoring:answer', handleAnswer);
      // screenSocket.off('video-proctoring:ice-candidate', handleIceCandidate);
      // screenSocket.off('video-proctoring:student-joined', handleStudentJoined);
    };
  }, [testId, students]);

  const createPeerConnection = async (studentId, teacherId) => {
    try {
      // Don't create duplicate connections
      if (peerConnectionsRef.current[studentId]) {
        const pc = peerConnectionsRef.current[studentId];
        if (pc.connectionState === 'closed' || pc.connectionState === 'failed') {
          console.log(`[TEACHER] Existing connection failed, closing and recreating`);
          pc.close();
          delete peerConnectionsRef.current[studentId];
        } else {
          console.log(`[TEACHER] Connection already exists for student ${studentId}`);
          return;
        }
      }

      console.log(`[TEACHER] 🔗 Creating peer connection for student ${studentId}`);

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // CRITICAL: Handle incoming stream
      pc.ontrack = (event) => {
        console.log(`[TEACHER] 🎥🎥🎥 ONTRACK EVENT for student ${studentId} 🎥🎥🎥`, {
          streams: event.streams?.length || 0,
          track: event.track ? {
            kind: event.track.kind,
            id: event.track.id,
            enabled: event.track.enabled,
            readyState: event.track.readyState,
          } : null,
        });

        const [remoteStream] = event.streams;
        
        if (!remoteStream) {
          console.error(`[TEACHER] ❌ No stream in ontrack event`);
          if (event.track) {
            const newStream = new MediaStream([event.track]);
            updateStream(studentId, newStream);
          }
          return;
        }

        console.log(`[TEACHER] ✅✅✅ RECEIVED STREAM for student ${studentId} ✅✅✅`, {
          streamId: remoteStream.id,
          videoTracks: remoteStream.getVideoTracks().length,
          audioTracks: remoteStream.getAudioTracks().length,
        });

        updateStream(studentId, remoteStream);
      };

      // Connection state monitoring
      pc.onconnectionstatechange = () => {
        console.log(`[TEACHER] Connection state for ${studentId}: ${pc.connectionState}`);
        if (pc.connectionState === 'connected') {
          console.log(`[TEACHER] ✅✅✅ CONNECTED to student ${studentId} ✅✅✅`);
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
          console.warn(`[TEACHER] ⚠️ Connection lost for ${studentId}: ${pc.connectionState}`);
          
          // Remove stream from state
          setStudentStreams(prev => {
            const updated = { ...prev };
            delete updated[studentId];
            return updated;
          });
          
          // Attempt to reconnect after a delay
          if (pc.connectionState !== 'closed') {
            setTimeout(() => {
              console.log(`[TEACHER] Attempting to reconnect to ${studentId}`);
              if (!peerConnectionsRef.current[studentId] || peerConnectionsRef.current[studentId].connectionState === 'closed') {
                createPeerConnection(studentId, teacherId);
              }
            }, 3000);
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[TEACHER] ICE state for ${studentId}: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          console.log(`[TEACHER] ✅ ICE connected to student ${studentId}`);
        }
      };

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          screenSocket.emit('video-proctoring:ice-candidate', {
            testId,
            studentId,
            teacherId,
            candidate: event.candidate,
          });
        }
      };

      // Create and send offer
      console.log(`[TEACHER] 📤 Creating offer for student ${studentId}`);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await pc.setLocalDescription(offer);
      console.log(`[TEACHER] ✅ Local description set`);

      // Store peer connection
      peerConnectionsRef.current[studentId] = pc;

      // Send offer
      const studentIdStr = studentId?.toString() || studentId;
      if (screenSocket.connected) {
        console.log(`[TEACHER] 📤 Sending offer to student ${studentIdStr}`);
        screenSocket.emit('video-proctoring:offer', {
          testId,
          studentId: studentIdStr,
          teacherId,
          offer,
        });
        console.log(`[TEACHER] ✅ Offer sent`);
      } else {
        console.error(`[TEACHER] ❌ Socket not connected, cannot send offer`);
      }
    } catch (err) {
      console.error(`[TEACHER] ❌ Error creating peer connection:`, err);
    }
  };

  const updateStream = (studentId, remoteStream) => {
    // Monitor tracks
    remoteStream.getVideoTracks().forEach((track) => {
      track.onended = () => console.warn(`[TEACHER] Video track ended for ${studentId}`);
    });
    
    remoteStream.getAudioTracks().forEach((track) => {
      track.onended = () => console.warn(`[TEACHER] Audio track ended for ${studentId}`);
      track.onmute = () => {
        setStudentAudioEnabled(prev => ({ ...prev, [studentId]: false }));
      };
      track.onunmute = () => {
        setStudentAudioEnabled(prev => ({ ...prev, [studentId]: true }));
      };
    });

    // Update stream state
    setStudentStreams(prev => {
      const existing = prev[studentId];
      if (!existing || existing.id !== remoteStream.id) {
        console.log(`[TEACHER] 📹 Updating stream state for ${studentId}`);
        return { ...prev, [studentId]: remoteStream };
      }
      return prev;
    });

    // Set up audio element
    if (!audioRefsRef.current[studentId]) {
      const audioElement = document.createElement('audio');
      audioElement.srcObject = remoteStream;
      audioElement.autoplay = true;
      audioElement.playsInline = true;
      audioElement.className = 'hidden';
      audioElement.muted = false;
      document.body.appendChild(audioElement);
      audioRefsRef.current[studentId] = audioElement;
      audioElement.play().catch(console.warn);
    } else {
      audioRefsRef.current[studentId].srcObject = remoteStream;
    }

    // Update audio state
    const audioTrack = remoteStream.getAudioTracks()[0];
    setStudentAudioEnabled(prev => ({
      ...prev,
      [studentId]: audioTrack ? (audioTrack.enabled && !audioTrack.muted) : true,
    }));
  };

  // Update video elements when streams arrive
  useEffect(() => {
    console.log(`[VIDEO UPDATE] Streams changed: ${Object.keys(studentStreams).length} streams`);
    Object.keys(studentStreams).forEach((studentId) => {
      const stream = studentStreams[studentId];
      const videoEl = videoRefsRef.current[studentId];
      
      if (videoEl && stream) {
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0) {
          console.warn(`[VIDEO UPDATE] No video tracks for ${studentId}`);
          return;
        }

        const currentSrc = videoEl.srcObject;
        if (!currentSrc || currentSrc !== stream) {
          console.log(`[VIDEO UPDATE] ✅ Setting video for ${studentId}`);
          videoEl.srcObject = stream;
          videoEl.play().catch((err) => {
            console.error(`[VIDEO UPDATE] Play error:`, err);
            setTimeout(() => videoEl.play().catch(console.error), 500);
          });
        } else if (videoEl.paused) {
          videoEl.play().catch(console.error);
        }
      }
    });
  }, [studentStreams]);

  // Update focused video
  useEffect(() => {
    if (focusedStudentId && studentStreams[focusedStudentId]) {
      const stream = studentStreams[focusedStudentId];
      
      if (focusedVideoRef.current) {
        if (!focusedVideoRef.current.srcObject || focusedVideoRef.current.srcObject !== stream) {
          focusedVideoRef.current.srcObject = stream;
          focusedVideoRef.current.play().catch(console.error);
        }
      }
      
      if (focusedAudioRef.current) {
        if (!focusedAudioRef.current.srcObject || focusedAudioRef.current.srcObject !== stream) {
          focusedAudioRef.current.srcObject = stream;
          focusedAudioRef.current.muted = audioRefsRef.current[focusedStudentId]?.muted || false;
          focusedAudioRef.current.play().catch(console.warn);
        }
      }
    }
  }, [focusedStudentId, studentStreams]);

  const toggleStudentAudio = useCallback((studentId) => {
    const audioElement = audioRefsRef.current[studentId];
    if (audioElement) {
      const newMutedState = !audioElement.muted;
      audioElement.muted = newMutedState;
      
      if (focusedStudentId === studentId && focusedAudioRef.current) {
        focusedAudioRef.current.muted = newMutedState;
      }
      
      setStudentAudioEnabled(prev => ({
        ...prev,
        [studentId]: !newMutedState,
      }));
    }
  }, [focusedStudentId]);

  const handleFocusStudent = useCallback((studentId) => {
    setFocusedStudentId(studentId);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-600 text-sm font-medium">Unable to open video proctoring</p>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => navigate(`/teacher/proctoring/${testId}`)}
            className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700"
          >
            <FaArrowLeft className="w-3 h-3 mr-2" />
            Back to Proctoring
          </button>
        </div>
      </div>
    );
  }

  const focusedStudent = students.find((s) => (s.id || s._id) === focusedStudentId);
  const focusedStream = focusedStudentId ? studentStreams[focusedStudentId] : null;
  const focusedAudioEnabled = focusedStudentId ? studentAudioEnabled[focusedStudentId] !== false : true;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate(`/teacher/proctoring/${testId}`)}
            className="text-slate-300 hover:text-white"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Video Proctoring</h1>
            <p className="text-xs text-slate-400">
              {students.length} student{students.length !== 1 ? 's' : ''} • {Object.keys(studentStreams).length} connected • Click a video to enlarge
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {students.map((student) => {
                const studentId = student.id || student._id;
                const stream = studentStreams[studentId];
                const isAudioEnabled = studentAudioEnabled[studentId] !== false;
                const isFocused = focusedStudentId === studentId;

                return (
                  <div
                    key={studentId}
                    className={`relative aspect-video w-full bg-slate-800 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      isFocused
                        ? 'border-purple-500 ring-2 ring-purple-400'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => handleFocusStudent(studentId)}
                  >
                    <video
                      ref={(el) => {
                        if (el) {
                          videoRefsRef.current[studentId] = el;
                          const currentStream = studentStreams[studentId];
                          if (currentStream && el.srcObject !== currentStream) {
                            el.srcObject = currentStream;
                            el.play().catch(console.error);
                          }
                        } else {
                          delete videoRefsRef.current[studentId];
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ display: stream ? 'block' : 'none' }}
                      onLoadedMetadata={() => {
                        const videoEl = videoRefsRef.current[studentId];
                        if (videoEl && videoEl.srcObject) {
                          videoEl.play().catch(console.error);
                        }
                      }}
                      onPlaying={() => {
                        console.log(`[VIDEO] ✅ Playing for ${studentId}`);
                      }}
                      onError={(e) => {
                        console.error(`[VIDEO] ❌ Error for ${studentId}:`, e);
                      }}
                    />
                    {!stream && (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-900 pointer-events-none">
                        <div className="text-center">
                          <FaVideoSlash className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-400">Connecting...</p>
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 px-2 py-1.5 flex items-center justify-between">
                      <p className="text-xs text-white font-medium truncate">
                        {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student'}
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        {stream && (
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStudentAudio(studentId);
                          }}
                          className={`p-1 rounded ${
                            isAudioEnabled
                              ? 'bg-slate-700 text-white'
                              : 'bg-red-600 text-white'
                          }`}
                          title={isAudioEnabled ? 'Mute' : 'Unmute'}
                        >
                          {isAudioEnabled ? (
                            <FaMicrophone className="w-3 h-3" />
                          ) : (
                            <FaMicrophoneSlash className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-xl">
              <div className="relative aspect-video bg-slate-900">
                {focusedStream && focusedStudent ? (
                  <>
                    <video
                      ref={(el) => {
                        if (el) {
                          focusedVideoRef.current = el;
                          if (focusedStream) {
                            if (!el.srcObject || el.srcObject !== focusedStream) {
                              el.srcObject = focusedStream;
                              el.play().catch(console.error);
                            }
                          }
                        } else {
                          focusedVideoRef.current = null;
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      onLoadedMetadata={() => {
                        if (focusedVideoRef.current && focusedVideoRef.current.srcObject) {
                          focusedVideoRef.current.play().catch(console.error);
                        }
                      }}
                    />
                    <audio
                      ref={(el) => {
                        if (el) {
                          focusedAudioRef.current = el;
                          if (focusedStream) {
                            if (!el.srcObject || el.srcObject !== focusedStream) {
                              el.srcObject = focusedStream;
                              el.muted = audioRefsRef.current[focusedStudentId]?.muted || false;
                              el.play().catch(console.warn);
                            }
                          }
                        } else {
                          focusedAudioRef.current = null;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="hidden"
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <FaVideoSlash className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">
                        {focusedStudent
                          ? 'Waiting for video from student...'
                          : 'Select a student to view their video'}
                      </p>
                    </div>
                  </div>
                )}

                {focusedStudent && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {focusedStudent.name ||
                          `${focusedStudent.firstName || ''} ${focusedStudent.lastName || ''}`.trim() ||
                          'Student'}
                      </p>
                      <p className="text-xs text-slate-300">{focusedStudent.email}</p>
                    </div>

                    {focusedStream && (
                      <button
                        type="button"
                        onClick={() => toggleStudentAudio(focusedStudentId)}
                        className={`p-3 rounded-lg transition-colors ${
                          focusedAudioEnabled
                            ? 'bg-slate-700 text-white hover:bg-slate-600'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                        title={focusedAudioEnabled ? 'Mute audio' : 'Unmute audio'}
                      >
                        {focusedAudioEnabled ? (
                          <FaMicrophone className="w-5 h-5" />
                        ) : (
                          <FaMicrophoneSlash className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {students.length === 0 && (
          <div className="text-center py-12">
            <FaVideoSlash className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No students connected yet</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoProctoring;
