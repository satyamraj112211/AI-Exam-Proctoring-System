import React, { useEffect, useRef, useState } from 'react';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import screenSocket from '../../services/realtime/screenSocket';

const StudentVideoProctor = ({ testId, studentId }) => {
  const [localStream, setLocalStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const videoRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const localStreamRef = useRef(null);
  const socketConnectedRef = useRef(false);

  // Initialize camera and microphone
  useEffect(() => {
    if (!testId || !studentId) {
      console.warn('[STUDENT] Missing testId or studentId');
      return;
    }

    if (isInitialized) {
      console.log('[STUDENT] Already initialized, skipping');
      return;
    }

    const studentIdStr = studentId?.toString() || studentId;
    console.log(`[STUDENT] 🚀 Initializing video proctoring for student ${studentIdStr}, testId: ${testId}`);

    const initializeMedia = async () => {
      try {
        setError('');
        
        // Step 1: Connect socket FIRST
        if (!screenSocket.connected) {
          console.log('[STUDENT] Connecting socket...');
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
        
        socketConnectedRef.current = true;
        console.log('[STUDENT] ✅ Socket connected');

        // Step 2: Join room IMMEDIATELY
        console.log(`[STUDENT] Joining video proctoring room...`);
        screenSocket.emit('video-proctoring:join', {
          testId,
          studentId: studentIdStr,
          role: 'student',
        });
        console.log('[STUDENT] ✅ Joined video proctoring room');

        // Step 3: Request camera and microphone access
        console.log('[STUDENT] Requesting camera and microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        console.log('[STUDENT] ✅ Camera and microphone access granted', {
          streamId: stream.id,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }

        setLocalStream(stream);
        localStreamRef.current = stream;
        setIsInitialized(true);

        // Step 4: Set up socket listeners
        setupSocketListeners(studentIdStr);

        console.log('[STUDENT] ✅ Video proctoring fully initialized');
      } catch (err) {
        console.error('[STUDENT] ❌ Error initializing:', err);
        setError(
          err.name === 'NotAllowedError'
            ? 'Camera and microphone access denied. Please allow access to continue.'
            : err.name === 'NotFoundError'
            ? 'Camera or microphone not found. Please connect a device.'
            : err.message || 'Failed to access camera and microphone. Please check your device permissions.'
        );
      }
    };

    const setupSocketListeners = (studentIdStr) => {
      console.log(`[STUDENT] Setting up socket listeners for student ${studentIdStr}`);
      
      // Remove any existing listeners to prevent duplicates
      screenSocket.off('video-proctoring:offer');
      screenSocket.off('video-proctoring:ice-candidate');
      
      // Handle offer from teacher
      screenSocket.on('video-proctoring:offer', async ({ offer, teacherSocketId, teacherId: tId }) => {
        console.log(`[STUDENT] 📥📥📥 RECEIVED OFFER from teacher ${tId} 📥📥📥`, {
          offerType: offer?.type,
          teacherSocketId,
          offerSDP: offer?.sdp?.substring(0, 200),
          hasOffer: !!offer,
        });
        
        await handleOffer({ offer, teacherSocketId, teacherId: tId, studentIdStr });
      });
      
      // Handle ICE candidates from teacher
      screenSocket.on('video-proctoring:ice-candidate', ({ candidate, teacherSocketId }) => {
        console.log(`[STUDENT] 📥 Received ICE candidate from teacher`);
        handleIceCandidate({ candidate, teacherSocketId });
      });
      
      console.log('[STUDENT] ✅ Socket listeners set up');
    };

    const handleOffer = async ({ offer, teacherSocketId, teacherId, studentIdStr }) => {
      try {
        // Don't create duplicate connections
        if (peerConnectionsRef.current[teacherSocketId]) {
          const existingPc = peerConnectionsRef.current[teacherSocketId];
          if (existingPc.connectionState === 'closed' || existingPc.connectionState === 'failed') {
            existingPc.close();
            delete peerConnectionsRef.current[teacherSocketId];
          } else {
            console.log(`[STUDENT] Peer connection already exists for teacher ${teacherSocketId}`);
            return;
          }
        }
        
        // Ensure we have a local stream
        if (!localStreamRef.current) {
          console.error('[STUDENT] ❌ No local stream available! Retrying in 1 second...');
          setTimeout(() => {
            if (localStreamRef.current) {
              handleOffer({ offer, teacherSocketId, teacherId, studentIdStr });
            }
          }, 1000);
          return;
        }
        
        console.log(`[STUDENT] Creating peer connection for teacher ${teacherId}`);
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        });

        // CRITICAL: Add tracks BEFORE setting remote description
        const tracks = localStreamRef.current.getTracks();
        console.log(`[STUDENT] Adding ${tracks.length} tracks to peer connection`, {
          videoTracks: tracks.filter(t => t.kind === 'video').length,
          audioTracks: tracks.filter(t => t.kind === 'audio').length,
        });
        
        tracks.forEach((track) => {
          try {
            pc.addTrack(track, localStreamRef.current);
            console.log(`[STUDENT] ✅ Added ${track.kind} track`);
          } catch (err) {
            console.error(`[STUDENT] ❌ Error adding ${track.kind} track:`, err);
          }
        });

        // Verify tracks
        const senders = pc.getSenders();
        console.log(`[STUDENT] Peer connection has ${senders.length} senders`);

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            screenSocket.emit('video-proctoring:ice-candidate', {
              testId,
              studentId: studentIdStr,
              teacherSocketId,
              candidate: event.candidate,
            });
          }
        };

        // Handle connection state
        pc.onconnectionstatechange = () => {
          console.log(`[STUDENT] Connection state: ${pc.connectionState}`);
        };

        // Set remote description
        console.log(`[STUDENT] Setting remote description...`);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log(`[STUDENT] ✅ Remote description set`);
        
        // Create answer
        const answer = await pc.createAnswer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false,
        });
        console.log(`[STUDENT] Answer created: ${answer.type}`);
        
        await pc.setLocalDescription(answer);
        console.log(`[STUDENT] ✅ Local description set`);

        // Send answer
        console.log(`[STUDENT] 📤📤📤 SENDING ANSWER to teacher ${teacherId} 📤📤📤`, {
          testId,
          studentId: studentIdStr,
          teacherSocketId,
          answerType: answer.type,
          answerSDP: answer.sdp?.substring(0, 200),
        });
        
        screenSocket.emit('video-proctoring:answer', {
          testId,
          studentId: studentIdStr,
          teacherSocketId,
          teacherId,
          answer,
        });
        
        console.log(`[STUDENT] ✅ Answer emit completed`);

        // Store peer connection
        peerConnectionsRef.current[teacherSocketId] = pc;
        console.log(`[STUDENT] ✅ Peer connection established`);
      } catch (err) {
        console.error('[STUDENT] ❌ Error handling offer:', err);
        if (peerConnectionsRef.current[teacherSocketId]) {
          peerConnectionsRef.current[teacherSocketId].close();
          delete peerConnectionsRef.current[teacherSocketId];
        }
      }
    };

    const handleIceCandidate = ({ candidate, teacherSocketId }) => {
      const pc = peerConnectionsRef.current[teacherSocketId];
      if (pc && candidate) {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
          console.error('[STUDENT] Error adding ICE candidate:', err);
        });
      }
    };

    initializeMedia();

    return () => {
      console.log('[STUDENT] Cleaning up...');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        localStreamRef.current = null;
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        if (pc) pc.close();
      });
      peerConnectionsRef.current = {};
      screenSocket.off('video-proctoring:offer');
      screenSocket.off('video-proctoring:ice-candidate');
    };
  }, [testId, studentId, isInitialized]);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
        
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const senders = pc.getSenders();
          senders.forEach((sender) => {
            if (sender.track && sender.track.kind === 'video') {
              sender.track.enabled = !isVideoEnabled;
            }
          });
        });
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
        
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const senders = pc.getSenders();
          senders.forEach((sender) => {
            if (sender.track && sender.track.kind === 'audio') {
              sender.track.enabled = !isAudioEnabled;
            }
          });
        });
      }
    }
  };

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm z-50">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => {
            setError('');
            setIsInitialized(false);
          }}
          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-40">
      <div className="flex items-center space-x-3">
        <div className="relative w-32 h-24 bg-slate-900 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <FaVideoSlash className="w-6 h-6 text-slate-400" />
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <button
            onClick={toggleVideo}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isVideoEnabled
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {isVideoEnabled ? (
              <>
                <FaVideo className="w-4 h-4" />
                <span>Video On</span>
              </>
            ) : (
              <>
                <FaVideoSlash className="w-4 h-4" />
                <span>Video Off</span>
              </>
            )}
          </button>

          <button
            onClick={toggleAudio}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isAudioEnabled
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {isAudioEnabled ? (
              <>
                <FaMicrophone className="w-4 h-4" />
                <span>Mic On</span>
              </>
            ) : (
              <>
                <FaMicrophoneSlash className="w-4 h-4" />
                <span>Mic Off</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentVideoProctor;
