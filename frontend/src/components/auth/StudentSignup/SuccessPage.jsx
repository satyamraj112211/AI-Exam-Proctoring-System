import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaHome, FaUser } from 'react-icons/fa';

const SuccessPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          {/* Success Icon */}
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

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Registration Successful! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Your student account has been created successfully.
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            A welcome email has been sent to your registered email address.
          </p>

          {/* Redirect Timer */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">
                Redirecting to homepage in
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                5
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                seconds...
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
            >
              <FaHome />
              <span>Go to Homepage</span>
            </button>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
            >
              <FaUser />
              <span>Go to Dashboard</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help?{' '}
              <button
                onClick={() => navigate('/contact')}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Contact Support
              </button>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SuccessPage;