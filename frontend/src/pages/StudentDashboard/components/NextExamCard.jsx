import React, { useState, useEffect } from 'react';
import { FaPlay, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const NextExamCard = ({ nextExam }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!nextExam || !nextExam.scheduledDate) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const scheduled = new Date(nextExam.scheduledDate);
      const diff = scheduled - now;

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [nextExam]);

  const formatTime = (value) => {
    return value.toString().padStart(2, '0');
  };

  if (!nextExam) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Next Scheduled Exam</h3>
        <div className="text-center py-8">
          <p className="text-slate-500">No upcoming exams</p>
          <p className="text-sm text-slate-400 mt-2">N/A</p>
        </div>
      </motion.div>
    );
  }

  const scheduledDate = new Date(nextExam.scheduledDate);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Next Scheduled Exam</h3>
      
      <div className="mb-4">
        <p className="text-slate-900 font-medium">{nextExam.title}</p>
        <p className="text-sm text-slate-600 mt-1">
          {nextExam.course} - {formattedDate} - {formattedTime}
        </p>
      </div>

      {timeRemaining && (
        <div className="mb-4">
          <div className="flex items-center justify-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <span className="text-3xl font-mono font-bold text-slate-900">
              {formatTime(timeRemaining.hours)}:
              {formatTime(timeRemaining.minutes)}:
              {formatTime(timeRemaining.seconds)}
            </span>
          </div>
        </div>
      )}

      <button
        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm"
        onClick={() => {
          if (nextExam.id) {
            window.location.href = `/student/exams/${nextExam.id}`;
          }
        }}
      >
        <FaPlay className="w-4 h-4" />
        <span>Start Exam</span>
      </button>
    </motion.div>
  );
};

export default NextExamCard;









