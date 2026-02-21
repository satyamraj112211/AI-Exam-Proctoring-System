import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaClock, FaChartBar, FaArrowLeft } from 'react-icons/fa';
import { testAPI } from '../services/api/testAPI';
import Sidebar from './StudentDashboard/components/Sidebar';
import Header from './StudentDashboard/components/Header';
import { dashboardAPI } from '../services/api/dashboardAPI';

const StudentResult = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        const resultData = await testAPI.getResult(testId);
        setResult(resultData);
      } catch (e) {
        console.error('Error loading result:', e);
        setError(e.message || 'Failed to load result');
      } finally {
        setLoading(false);
      }
    };

    const loadStudentData = async () => {
      try {
        const dashboardData = await dashboardAPI.getDashboard();
        setStudentData(dashboardData);
      } catch (e) {
        console.error('Error loading student data:', e);
      }
    };

    loadResult();
    loadStudentData();
  }, [testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-600"></div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Result not found'}</p>
            <button
              onClick={() => navigate('/student/available-exams')}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              Back to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  const studentName = studentData?.student?.name || 'Student';
  const resolveAvatarUrl = (rawUrl) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    if (rawUrl.startsWith('/uploads')) {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      return `${BACKEND_URL}${rawUrl}`;
    }
    return rawUrl;
  };
  const avatarUrl = resolveAvatarUrl(studentData?.student?.profileImage);

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header studentName={studentName} avatarUrl={avatarUrl} />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {/* Back Button */}
          <button
            onClick={() => navigate('/student/available-exams')}
            className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <FaArrowLeft />
            <span>Back to Available Exams</span>
          </button>

          {/* Result Header */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
              <div className="text-center mb-6">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  result.result.isPassed ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {result.result.isPassed ? (
                    <FaCheckCircle className="w-12 h-12 text-green-600" />
                  ) : (
                    <FaTimesCircle className="w-12 h-12 text-red-600" />
                  )}
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {result.test.title}
                </h1>
                <p className="text-slate-600">{result.test.description || result.test.course}</p>
              </div>

              {/* Score Card */}
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-600 mb-2">Marks Obtained</p>
                    <p className="text-4xl font-bold text-sky-600">
                      {result.result.totalMarksObtained}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      out of {result.result.totalMarksPossible}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600 mb-2">Percentage</p>
                    <p className="text-4xl font-bold text-slate-900">
                      {result.result.percentage}%
                    </p>
                    <p className={`text-sm font-semibold mt-1 ${
                      result.result.isPassed ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.result.isPassed ? 'Passed' : 'Failed'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600 mb-2">Time Spent</p>
                    <p className="text-2xl font-bold text-slate-700">
                      {formatTime(result.timeSpent)}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Duration: {result.test.duration} minutes
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <FaCheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{result.result.correctAnswers}</p>
                  <p className="text-xs text-slate-600 mt-1">Correct</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                  <FaTimesCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{result.result.wrongAnswers}</p>
                  <p className="text-xs text-slate-600 mt-1">Wrong</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <FaChartBar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{result.result.attemptedQuestions}</p>
                  <p className="text-xs text-slate-600 mt-1">Attempted</p>
                </div>
                <div className="bg-slate-100 rounded-lg p-4 text-center border border-slate-300">
                  <FaClock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-600">{result.result.notAttemptedQuestions}</p>
                  <p className="text-xs text-slate-600 mt-1">Not Attempted</p>
                </div>
              </div>

              {/* Submission Info */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Submitted on: {new Date(result.submittedAt).toLocaleString()}</span>
                  <span>Test Type: {result.test.testType?.toUpperCase() || 'MCQ'}</span>
                </div>
              </div>
            </div>

            {/* Answer Details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Answer Details</h2>
              <div className="space-y-4">
                {result.answers.map((answer, index) => (
                  <div
                    key={answer.questionId}
                    className={`border rounded-lg p-4 ${
                      answer.isCorrect
                        ? 'bg-green-50 border-green-200'
                        : answer.isAttempted
                        ? 'bg-red-50 border-red-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900">Q{index + 1}</span>
                        {answer.isCorrect ? (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                            Correct
                          </span>
                        ) : answer.isAttempted ? (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">
                            Wrong
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-full font-medium">
                            Not Attempted
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-600">
                        {answer.marksObtained >= 0 ? '+' : ''}{answer.marksObtained} / {answer.maxMarks}
                      </span>
                    </div>
                    <p className="text-slate-900 mb-3 font-medium">{answer.questionText}</p>
                    {answer.options && answer.options.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {answer.options.map((option, optIdx) => {
                          const isSelected = answer.selectedAnswer === option;
                          const isCorrect = answer.correctAnswer === option;
                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded border ${
                                isCorrect
                                  ? 'bg-green-100 border-green-300'
                                  : isSelected
                                  ? 'bg-red-100 border-red-300'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <span className="text-sm text-slate-700">
                                {option}
                                {isCorrect && ' ✓'}
                                {isSelected && !isCorrect && ' ✗'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {answer.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-900">
                          <span className="font-semibold">Explanation:</span> {answer.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentResult;


