import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaCheck, FaLock, FaSpinner } from 'react-icons/fa';
import { teacherAuthAPI } from '../../../services/api/authAPI';

const Step2OTP = ({ email, onPrev, onNext, markVerified }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(countdown);
    }
    setCanResend(true);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await teacherAuthAPI.sendOTP(email);
      if (response?.success) {
        setSuccess('New OTP sent successfully');
        setTimer(300);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(response?.message || 'Unable to resend OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await teacherAuthAPI.verifyOTP(email, code);
      if (response?.success) {
        setSuccess(response.message || 'OTP verified successfully');
        markVerified(true);
        setTimeout(onNext, 500);
      } else {
        setError(response?.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Verify Your Email
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Step 2: Enter the 6-digit OTP sent to {email}
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Enter OTP
          </label>
          <div className="flex justify-center space-x-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                disabled={loading}
              />
            ))}
          </div>
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Time remaining: <span className="font-mono">{formatTime(timer)}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-600 dark:text-green-400 text-sm flex items-center justify-center">
              <FaCheck className="mr-2" />
              {success}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onPrev}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center space-x-2"
            disabled={loading}
          >
            <FaArrowLeft />
            <span>Back</span>
          </button>

          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify OTP</span>
                <FaArrowRight />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Didn't receive the OTP?
        </p>
        <button
          onClick={handleResend}
          disabled={!canResend || loading}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {canResend ? 'Resend OTP' : `Resend OTP in ${formatTime(timer)}`}
        </button>
      </div>
    </motion.div>
  );
};

export default Step2OTP;

























