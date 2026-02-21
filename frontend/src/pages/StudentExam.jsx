import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FaClock, FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaSave, FaCheckCircle } from 'react-icons/fa';
import { testAPI } from '../services/api/testAPI';
import axiosClient from '../services/axiosClient';
import screenSocket from '../services/realtime/screenSocket';
import StudentChat from '../components/Chat/StudentChat';
import StudentVideoProctor from '../components/VideoProctoring/StudentVideoProctor';
import { studentAuthAPI } from '../services/api/authAPI';

const STATUS = {
  UNVISITED: 'unvisited',
  VISITED: 'visited',
  ANSWERED: 'answered',
};

const StudentExam = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visited, setVisited] = useState({});
  const [warnings, setWarnings] = useState(0);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [totalDuration, setTotalDuration] = useState(null); // Store initial duration in seconds
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devToolsWarningShown, setDevToolsWarningShown] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const screenIntervalRef = useRef(null);
  const [student, setStudent] = useState(null);

  // Check authentication before loading test and get student info
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/student-login', { replace: true });
      return;
    }
    
    // Get student data from localStorage
    const studentData = studentAuthAPI.getCurrentStudent();
    if (studentData) {
      setStudent(studentData);
    }
  }, [navigate]);

  // Load test from backend API
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to access this test.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const testData = await testAPI.getById(testId);
        
        // axiosClient already returns response.data
        // Backend returns ApiResponse: { status, data: { id, title, questions, ... }, message }
        // So testData is already the ApiResponse object, extract data
        const testInfo = testData?.data || testData;
        
        console.log('Test API Response:', { testData, testInfo });
        
        if (!testInfo || !testInfo.questions) {
          setError('Test not found or no longer available.');
          return;
        }

        // Sort questions by order
        const sortedQuestions = [...(testInfo.questions || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        setTest({
          id: testInfo.id,
          title: testInfo.title,
          description: testInfo.description,
          course: testInfo.course,
          duration: testInfo.duration,
          totalMarks: testInfo.totalMarks,
          passingMarks: testInfo.passingMarks,
          instructions: testInfo.instructions,
          scheduledDate: testInfo.scheduledDate,
          questions: sortedQuestions,
        });

        // Initialize time if duration is available
        if (testInfo.duration) {
          const durationInSeconds = testInfo.duration * 60; // Convert minutes to seconds
          setTotalDuration(durationInSeconds);
          setTimeRemaining(durationInSeconds);
          setStartTime(new Date());
        }
      } catch (e) {
        console.error('Error loading test:', e);
        
        // Handle authentication errors
        if (e.response?.status === 401 || e.message?.includes('authentication') || e.message?.includes('401')) {
          localStorage.removeItem('token');
          localStorage.removeItem('student');
          navigate('/auth/student-login', { replace: true });
          return;
        }
        
        setError(e.message || 'Unable to load test. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [testId]);

  // Ask for screen sharing when the student starts the test
  const startScreenShare = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      console.warn('Screen sharing API not available in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      setScreenStream(stream);
      // Begin sending thumbnail frames over Socket.io for teacher view
      await startFrameStreaming(stream);
    } catch (err) {
      console.warn('Student denied screen sharing or an error occurred:', err);
      // Do not block the exam; simply proceed without screen sharing.
    }
  };

  const startFrameStreaming = async (stream) => {
    try {
      const studentRaw = localStorage.getItem('student');
      const student = studentRaw ? JSON.parse(studentRaw) : null;
      const studentId = student?._id || student?.id;
      if (!studentId) {
        console.warn('No student ID found for screen share');
        return;
      }

      // Join signaling room once
      if (!screenSocket.connected) {
        screenSocket.connect();
      }

      screenSocket.emit('proctoring:join', {
        testId,
        role: 'student',
        userId: studentId,
      });

      // Create hidden video + canvas for snapshots
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Target resolution for smoother streaming with lower bandwidth
      const TARGET_WIDTH = 960;
      const TARGET_HEIGHT = 540;

      const sendFrame = () => {
        if (video.readyState < 2) return;

        // Downscale to a fixed HD-ish resolution to avoid heavy frames
        const srcW = video.videoWidth || TARGET_WIDTH;
        const srcH = video.videoHeight || TARGET_HEIGHT;
        const scale = Math.min(TARGET_WIDTH / srcW, TARGET_HEIGHT / srcH);
        const w = Math.round(srcW * scale);
        const h = Math.round(srcH * scale);

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);

        const image = canvas.toDataURL('image/jpeg', 0.5); // slightly higher quality

        if (screenSocket.connected) {
          screenSocket.emit('screen:frame', {
            testId,
            studentId,
            image,
          });
        }
      };

      // Send ~4fps thumbnails for smoother motion but still lightweight
      if (screenIntervalRef.current) {
        clearInterval(screenIntervalRef.current);
      }
      screenIntervalRef.current = window.setInterval(sendFrame, 250);

      // Stop streaming when capture ends
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (screenIntervalRef.current) {
          clearInterval(screenIntervalRef.current);
          screenIntervalRef.current = null;
        }
      });
    } catch (err) {
      console.error('Error starting thumbnail screen streaming:', err);
    }
  };

  // Timer countdown - fixed to count accurately
  useEffect(() => {
    if (!totalDuration || !startTime || autoSubmitted || submissionResult) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000); // Elapsed time in seconds
      const remaining = Math.max(0, totalDuration - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        clearInterval(interval);
        handleSubmit(true, false); // Auto-submit when time runs out
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [totalDuration, startTime, autoSubmitted, submissionResult]);

  // Track tab/window focus for anti-cheat (auto-submit temporarily disabled)
  useEffect(() => {
    if (!test || autoSubmitted || showInstructions) return;

    let devToolsOpen = false;

    const checkDevTools = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          // Only increment warnings for now; do NOT auto-submit
          setWarnings((prev) => prev + 1);
        }
      } else {
        devToolsOpen = false;
      }
    }, 1000);

    const handleBlur = () => {
      // Only increment warnings for tab switch; do NOT auto-submit
      setWarnings((prev) => prev + 1);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur();
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(checkDevTools);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [test, autoSubmitted, showInstructions]);

  const questions = test?.questions || [];

  const statuses = useMemo(() => {
    const map = {};
    questions.forEach((q, idx) => {
      const key = String(idx);
      if (!visited[key]) {
        map[key] = STATUS.UNVISITED;
      } else if (answers[key] && answers[key].length > 0) {
        map[key] = STATUS.ANSWERED;
      } else {
        map[key] = STATUS.VISITED;
      }
    });
    return map;
  }, [questions, visited, answers]);

  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectOption = (index, option) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: [option], // Single select - array with one option
    }));
    setVisited((prev) => ({ ...prev, [index]: true }));
  };

  const goToQuestion = (index) => {
    setVisited((prev) => ({ ...prev, [index]: true }));
    setCurrentIndex(index);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  const handleSave = async () => {
    try {
      // Save answers to localStorage as backup
      localStorage.setItem(`test_${testId}_answers`, JSON.stringify(answers));
      // TODO: Save to backend when API is ready
      alert('Answers saved successfully!');
    } catch (e) {
      console.error('Error saving answers:', e);
    }
  };

  const handleSubmit = async (forced = false, isAutoSubmitted = false) => {
    if (!forced && !showSubmitConfirm) {
      setShowSubmitConfirm(true);
      return;
    }

    const confirmSubmit =
      forced ||
      window.confirm(
        'Are you sure you want to submit the test? You will not be able to change your answers afterwards.',
      );
    if (!confirmSubmit) {
      setShowSubmitConfirm(false);
      return;
    }

    if (isSubmitting) return; // Prevent double submission

    try {
      setIsSubmitting(true);
      setAutoSubmitted(true);

      // Prepare answers in the format expected by backend
      const answerArray = questions.map((question, index) => {
        const answerKey = String(index);
        const selectedAnswer = answers[answerKey] && answers[answerKey].length > 0 
          ? answers[answerKey][0] 
          : null;
        
        return {
          questionId: question.id,
          selectedAnswer: selectedAnswer
        };
      });

      const timeSpent = startTime ? Math.floor((new Date() - startTime) / 1000) : 0;

      // Submit to backend
      const result = await testAPI.submitAttempt(testId, {
        answers: answerArray,
        timeSpent: timeSpent,
        isAutoSubmitted: isAutoSubmitted || warnings >= 3
      });

      // Store result and show it
      setSubmissionResult(result);
      
      // Clear localStorage backup
      localStorage.removeItem(`test_${testId}_answers`);
      
      // Invalidate dashboard query to refresh performance trends
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      
    } catch (e) {
      console.error('Error submitting test:', e);
      setAutoSubmitted(false);
      setIsSubmitting(false);
      alert(e.message || 'Error submitting test. Please try again.');
    }
  };

  // Load saved answers on mount
  useEffect(() => {
    if (test) {
      try {
        const saved = localStorage.getItem(`test_${testId}_answers`);
        if (saved) {
          const savedAnswers = JSON.parse(saved);
          setAnswers(savedAnswers);
          // Mark all answered questions as visited
          Object.keys(savedAnswers).forEach((key) => {
            if (savedAnswers[key] && savedAnswers[key].length > 0) {
              setVisited((prev) => ({ ...prev, [key]: true }));
            }
          });
        }
      } catch (e) {
        console.error('Error loading saved answers:', e);
      }
    }
  }, [test, testId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-600" />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Test not available.'}</p>
          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            {test.title}
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Duration: {test.duration} minutes • Total Questions: {questions.length} • Total Marks: {test.totalMarks}
          </p>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Instructions</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
              {test.instructions && (
                <li className="whitespace-pre-line">{test.instructions}</li>
              )}
              <li>Do not close this tab or switch to other applications unnecessarily.</li>
              <li>Do not open browser developer tools (F12) or inspect the page.</li>
              <li>Browser extensions that interfere with the exam are not allowed.</li>
              <li>You will receive warnings if suspicious activity is detected. After 3 warnings, the test will be auto-submitted.</li>
              <li>Red boxes indicate unvisited questions, grey boxes indicate visited but unanswered questions, and green boxes indicate answered questions.</li>
              <li>Review your answers carefully before submitting the test.</li>
              <li>Use the "Save" button to save your progress periodically.</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="px-6 py-2.5 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                setShowInstructions(false);
                // Request screen sharing as soon as the exam actually starts
                await startScreenShare();
              }}
              className="px-6 py-2.5 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
            >
              I understand, Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show result after submission
  if (submissionResult) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              submissionResult.isPassed ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {submissionResult.isPassed ? (
                <FaCheckCircle className="w-10 h-10 text-green-600" />
              ) : (
                <FaExclamationTriangle className="w-10 h-10 text-red-600" />
              )}
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Test Submitted Successfully!
            </h2>
            {submissionResult.isAutoSubmitted && (
              <p className="text-sm text-amber-600 mb-2">
                Test was auto-submitted due to suspicious activity
              </p>
            )}
          </div>

          {/* Result Summary */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Score</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-sky-600">
                  {submissionResult.totalMarksObtained}
                </p>
                <p className="text-sm text-slate-600">Marks Obtained</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-700">
                  {submissionResult.totalMarksPossible}
                </p>
                <p className="text-sm text-slate-600">Total Marks</p>
              </div>
            </div>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-slate-900">
                {submissionResult.percentage}%
              </p>
              <p className="text-sm text-slate-600">Percentage</p>
            </div>
            <div className={`text-center py-2 rounded-lg ${
              submissionResult.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <p className="font-semibold">
                {submissionResult.isPassed ? 'Passed ✓' : 'Failed ✗'}
              </p>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{submissionResult.correctAnswers}</p>
              <p className="text-xs text-slate-600 mt-1">Correct</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{submissionResult.wrongAnswers}</p>
              <p className="text-xs text-slate-600 mt-1">Wrong</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{submissionResult.attemptedQuestions}</p>
              <p className="text-xs text-slate-600 mt-1">Attempted</p>
            </div>
            <div className="bg-slate-100 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-slate-600">{submissionResult.notAttemptedQuestions}</p>
              <p className="text-xs text-slate-600 mt-1">Not Attempted</p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/student/available-exams', { replace: true })}
              className="px-6 py-3 rounded-lg bg-sky-600 text-white hover:bg-sky-700 font-medium shadow-sm"
            >
              View Available Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSubmitConfirm) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Confirm Submission
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Are you sure you want to submit the test? You will not be able to change your answers afterwards.
          </p>
          <div className="space-y-2 mb-6 text-sm">
            <p className="text-slate-700">
              <span className="font-medium">Total Questions:</span> {questions.length}
            </p>
            <p className="text-slate-700">
              <span className="font-medium">Answered:</span>{' '}
              {Object.values(answers).filter(a => a && a.length > 0).length}
            </p>
            <p className="text-slate-700">
              <span className="font-medium">Unanswered:</span>{' '}
              {questions.length - Object.values(answers).filter(a => a && a.length > 0).length}
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(false)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{test.title}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Question {currentIndex + 1} of {questions.length} • Total Marks: {test.totalMarks}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {warnings > 0 && (
              <div className="flex items-center text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <FaExclamationTriangle className="mr-1.5" />
                Warning {warnings}/3
              </div>
            )}
            {timeRemaining !== null && (
              <div className="flex items-center text-sm font-medium text-slate-700">
                <FaClock className="mr-2" />
                <span className={timeRemaining < 300 ? 'text-red-600' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - 70/30 Split */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side - 70% - Question Area */}
        <section className="flex-[0.7] p-8 overflow-y-auto bg-slate-50">
          {currentQuestion && (
            <div className="max-w-4xl mx-auto">
              {/* Question Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    {currentQuestion.questionText || currentQuestion.prompt}
                  </h2>
                  {currentQuestion.marks && (
                    <p className="text-sm text-slate-500">
                      Marks: {currentQuestion.marks}
                      {currentQuestion.negativeMarks > 0 && (
                        <span className="text-red-600 ml-2">
                          (Negative: -{currentQuestion.negativeMarks})
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Options - Radio Buttons */}
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, optIndex) => {
                    const isSelected = (answers[currentIndex] || []).includes(option);
                    return (
                      <label
                        key={optIndex}
                        className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentIndex}`}
                          value={option}
                          checked={isSelected}
                          onChange={() => handleSelectOption(currentIndex, option)}
                          className="mt-1 mr-4 w-5 h-5 text-sky-600 focus:ring-sky-500 focus:ring-2"
                        />
                        <span className="flex-1 text-slate-900 text-base">
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentIndex === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FaChevronLeft />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentIndex === questions.length - 1}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentIndex === questions.length - 1
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm'
                  }`}
                >
                  Next
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Side - 30% - Question Navigator */}
        <aside className="flex-[0.3] border-l border-slate-200 bg-white p-6 overflow-y-auto">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            Question Navigator
          </h3>

          {/* Question Numbers Grid */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((_, idx) => {
              const status = statuses[String(idx)];
              const isCurrent = idx === currentIndex;
              let bgColor = 'bg-red-500 hover:bg-red-600';
              if (status === STATUS.VISITED) bgColor = 'bg-gray-400 hover:bg-gray-500';
              if (status === STATUS.ANSWERED) bgColor = 'bg-green-500 hover:bg-green-600';

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToQuestion(idx)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold text-white flex items-center justify-center transition-colors ${
                    bgColor
                  } ${
                    isCurrent ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''
                  }`}
                  title={`Question ${idx + 1}${status === STATUS.ANSWERED ? ' - Answered' : status === STATUS.VISITED ? ' - Visited' : ' - Unvisited'}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">
              Status Legend
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500 flex-shrink-0"></div>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-400 flex-shrink-0"></div>
                <span>Visited (Not Attempted)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500 flex-shrink-0"></div>
                <span>Attempted</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-600 text-white hover:bg-slate-700 font-medium transition-colors"
            >
              <FaSave />
              Save Progress
            </button>
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSubmitting || autoSubmitted}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaCheckCircle />
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-sky-50 rounded-lg border border-sky-200">
            <h4 className="text-xs font-semibold text-sky-900 mb-2">
              Progress Summary
            </h4>
            <div className="space-y-1 text-xs text-sky-700">
              <p>
                Answered: {Object.values(answers).filter(a => a && a.length > 0).length} / {questions.length}
              </p>
              <p>
                Remaining: {questions.length - Object.values(answers).filter(a => a && a.length > 0).length}
              </p>
            </div>
          </div>
        </aside>
      </main>

      {/* Video Proctoring Component - Initialize immediately so teacher can see video */}
      {test && student && (
        <StudentVideoProctor
          testId={test.id || testId}
          studentId={student._id || student.id}
        />
      )}

      {/* Chat Component - Only show when test has started */}
      {!showInstructions && test && student && (
        <StudentChat
          testId={test.id || testId}
          studentId={student._id || student.id}
          studentName={student.name || `${student.firstName} ${student.lastName}`}
        />
      )}
    </div>
  );
};

export default StudentExam;
