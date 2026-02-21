import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaHome, FaUserTie } from 'react-icons/fa';

const SuccessPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [countdown, setCountdown] = useState(5);
  const teacher = state?.teacher;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <FaCheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
              <div className="absolute -top-2 -right-2 animate-ping">
                <div className="w-8 h-8 bg-green-400 rounded-full opacity-75"></div>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Teacher Registration Successful! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {teacher
              ? `Welcome, ${teacher.firstName} ${teacher.lastName}!`
              : 'Your teacher account has been created successfully.'}
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Redirecting to homepage in {countdown}...
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
            >
              <FaHome />
              <span>Go to Homepage</span>
            </button>

            <button
              onClick={() => navigate('/teacher/dashboard')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
            >
              <FaUserTie />
              <span>Open Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SuccessPage;

























