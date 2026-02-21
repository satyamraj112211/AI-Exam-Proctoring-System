import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaChartBar, FaClock } from 'react-icons/fa';

const QuickStatsCard = ({ stats }) => {
  const {
    examsCompleted = 0,
    totalExams = 0,
    averageScore = 0,
    averagePercentage = 0,
    totalTimeSpent = 0
  } = stats || {};

  // Calculate completion percentage
  // Use averagePercentage for display (it's more accurate as it's the average of individual percentages)
  const displayAverage = averagePercentage > 0 ? averagePercentage : 0;
  const completionPercentage = totalExams > 0 
    ? Math.round((examsCompleted / totalExams) * 100)
    : 0;

  // Circular progress component
  const CircularProgress = ({ percentage, label, value, color = 'blue' }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const colorClasses = {
      blue: 'text-blue-600',
      gray: 'text-gray-400'
    };

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="transform -rotate-90 w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-200"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={colorClasses[color]}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-lg font-bold ${colorClasses[color]}`}>
                {value}
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">
          {label}
        </p>
      </div>
    );
  };

  if (examsCompleted === 0 && totalExams === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Stats
        </h3>
        <div className="text-center py-8">
          <p className="text-slate-500">No data available</p>
          <p className="text-sm text-slate-400 mt-2">N/A</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Quick Stats
      </h3>

      <div className="flex justify-around mb-4">
        <CircularProgress
          percentage={completionPercentage}
          label="Exams Completed"
          value={`${examsCompleted}${totalExams > 0 ? `/${totalExams}` : ''}`}
          color="blue"
        />
        <CircularProgress
          percentage={displayAverage}
          label="Average Score"
          value={`${Math.round(displayAverage)}%`}
          color="gray"
        />
      </div>

      <div className="space-y-2 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 flex items-center">
            <FaChartBar className="mr-2" />
            Average Score
          </span>
          <span className="font-semibold text-slate-900">
            {Math.round(displayAverage)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 flex items-center">
            <FaClock className="mr-2" />
            Time Spent
          </span>
          <span className="font-semibold text-slate-900">
            {totalTimeSpent}h
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default QuickStatsCard;









