import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFileAlt, FaFlask, FaGlobe, FaClock, FaCalendarAlt, FaCode, FaRandom, FaListUl, FaTimesCircle } from 'react-icons/fa';

const AvailableExams = ({ exams }) => {
  const navigate = useNavigate();
  const getCourseIcon = (course) => {
    const courseLower = course?.toLowerCase() || '';
    if (courseLower.includes('chemistry') || courseLower.includes('organic')) {
      return FaFlask;
    }
    if (courseLower.includes('history') || courseLower.includes('world')) {
      return FaGlobe;
    }
    return FaFileAlt;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTestTypeIcon = (testType) => {
    const type = testType?.toLowerCase() || 'mcq';
    if (type === 'coding') return FaCode;
    if (type === 'hybrid') return FaRandom;
    return FaListUl; // MCQ
  };

  const getTestTypeColor = (testType) => {
    const type = testType?.toLowerCase() || 'mcq';
    if (type === 'coding') return 'bg-purple-100 text-purple-600';
    if (type === 'hybrid') return 'bg-orange-100 text-orange-600';
    return 'bg-sky-100 text-sky-600'; // MCQ
  };

  // Remove attempted exams from the list
  const visibleExams = (exams || []).filter((exam) => !exam.hasAttempted);

  if (!visibleExams || visibleExams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No available exams</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleExams.map((exam, index) => {
        const CourseIcon = getCourseIcon(exam.course);
        const TestTypeIcon = getTestTypeIcon(exam.testType);
        const testTypeColor = getTestTypeColor(exam.testType);
        
        const now = new Date();
        const startDate = new Date(exam.scheduledDate);
        const canStart = startDate <= now;
        const isExpired = exam.windowCloseDate && new Date(exam.windowCloseDate) < now;

        return (
          <motion.div
            key={exam.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className={`p-2 rounded-lg ${testTypeColor}`}>
                  <TestTypeIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">
                    {exam.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${testTypeColor}`}>
                      {exam.testType || 'MCQ'}
                    </span>
                    {exam.course && exam.course !== 'General' && (
                      <span className="text-xs text-slate-500 truncate">
                        {exam.course}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {exam.description && (
              <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                {exam.description}
              </p>
            )}

            <div className="space-y-2 text-xs text-slate-600 mb-3">
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="w-3 h-3 flex-shrink-0" />
                <span className="flex-1">
                  <span className="font-medium">Start:</span> {formatDateTime(exam.scheduledDate)}
                </span>
              </div>
              {exam.windowCloseDate && (
                <div className="flex items-center space-x-2">
                  <FaTimesCircle className="w-3 h-3 flex-shrink-0" />
                  <span className="flex-1">
                    <span className="font-medium">Closes:</span> {formatDateTime(exam.windowCloseDate)}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <FaClock className="w-3 h-3 flex-shrink-0" />
                <span>
                  <span className="font-medium">Duration:</span> {exam.duration} minutes
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Total Marks: {exam.totalMarks}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={!canStart || isExpired}
              onClick={() => navigate(`/student/exams/${exam.id}`)}
              className="mt-3 w-full text-center text-xs font-medium px-3 py-2 rounded-md border border-sky-600 text-sky-600 hover:bg-sky-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExpired ? 'Test Closed' : canStart ? 'Start Exam' : 'Not yet started'}
            </button>

            {exam.hasAttempted && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <span className="text-xs text-green-600 font-medium">
                  ✓ Attempted
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default AvailableExams;







