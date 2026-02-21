import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserTie, 
  FaUniversity, 
  FaIdCard, 
  FaLock, 
  FaCheckCircle, 
  FaArrowLeft,
  FaSpinner,
  FaEnvelope
} from 'react-icons/fa';
import { teacherAuthAPI } from '../../services/api/authAPI';
import './TeacherRegistration.css';

const universities = [
  'Harvard University',
  'Stanford University',
  'MIT',
  'University of Cambridge',
  'University of Oxford',
  'ETH Zurich',
  'University of Toronto',
  'University of Melbourne',
  'National University of Singapore',
  'University of Tokyo',
  'Indian Institute of Technology',
  'University of Delhi',
  'Other'
];

const TeacherRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    firstName: '',
    lastName: '',
    teacherId: '',
    university: '',
    otherUniversity: '',
    password: '',
    passwordConfirm: ''
  });

  // Step 1: Email & OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes in seconds

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (error) setError('');
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await teacherAuthAPI.sendOTP(formData.email);
      
      if (response.status === 'success') {
        setOtpSent(true);
        setSuccess('OTP sent to your email!');
        setOtpTimer(600); // Reset timer to 10 minutes
        
        // Start OTP countdown
        const timer = setInterval(() => {
          setOtpTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await teacherAuthAPI.verifyOTP(formData.email, formData.otp);
      
      if (response.status === 'success') {
        setOtpVerified(true);
        setSuccess('Email verified successfully!');
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.teacherId || 
        !formData.university || !formData.password || !formData.passwordConfirm) {
      setError('Please fill all required fields');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.university === 'Other' && !formData.otherUniversity) {
      setError('Please specify your university name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await teacherAuthAPI.register({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        teacherId: formData.teacherId.toUpperCase(),
        university: formData.university,
        otherUniversity: formData.university === 'Other' ? formData.otherUniversity : undefined,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm
      });

      if (response.status === 'success') {
        setSuccess('Registration successful! Redirecting...');
        setStep(3);
        
        // Start countdown
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              navigate('/teacher/dashboard');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Format timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FaUserTie className="text-4xl" />
                Teacher Registration
              </h1>
              <p className="text-blue-100 mt-2">
                Join our platform as an educator and manage your students
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200">Step {step} of 3</div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      step >= num ? 'bg-white w-8' : 'bg-blue-400 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-8 pt-8">
          <div className="flex justify-between relative">
            {['Email Verification', 'Personal Details', 'Complete'].map((label, index) => (
              <div key={index} className="flex flex-col items-center z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                  ${step > index + 1 ? 'bg-green-500' : step === index + 1 ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  {step > index + 1 ? <FaCheckCircle /> : index + 1}
                </div>
                <div className="mt-2 text-sm font-medium text-gray-600">{label}</div>
              </div>
            ))}
            <div className="absolute top-6 left-16 right-16 h-1 bg-gray-200 -z-10">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: '0%' }}
                animate={{ width: `${(step - 1) * 50}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold text-gray-800">Verify Your Email</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={otpSent}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="teacher@university.edu"
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter OTP <span className="text-red-500">*</span>
                          <span className="ml-2 text-sm font-normal text-red-600">
                            (Expires in: {formatTime(otpTimer)})
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="otp"
                            value={formData.otp}
                            onChange={handleChange}
                            maxLength={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center text-2xl tracking-widest"
                            placeholder="123456"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Check your email for the 6-digit OTP
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleVerifyOTP}
                          disabled={loading || otpTimer === 0}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? <FaSpinner className="animate-spin" /> : 'Verify OTP'}
                        </button>
                        
                        <button
                          onClick={handleSendOTP}
                          disabled={loading}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 disabled:opacity-50"
                        >
                          Resend OTP
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {!otpSent && (
                    <button
                      onClick={handleSendOTP}
                      disabled={loading || !formData.email}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? <FaSpinner className="animate-spin" /> : 'Send OTP'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
                onSubmit={handleSubmit}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Personal Details</h2>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <FaArrowLeft /> Back
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaUserTie className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="John"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teacher ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaIdCard className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        name="teacherId"
                        value={formData.teacherId}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase"
                        placeholder="TEACH001"
                        maxLength={12}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      6-12 alphanumeric characters (e.g., TEACH001)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      University <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaUniversity className="absolute left-3 top-3 text-gray-400" />
                      <select
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                      >
                        <option value="">Select University</option>
                        {universities.map((uni) => (
                          <option key={uni} value={uni}>{uni}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.university === 'Other' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        University Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="otherUniversity"
                        value={formData.otherUniversity}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Enter your university name"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="At least 8 characters"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : 'Complete Registration'}
                </button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaCheckCircle className="text-6xl text-green-500" />
                </div>
                
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Registration Successful! 🎉
                </h2>
                
                <p className="text-lg text-gray-600 mb-8">
                  Welcome to Exam Proctoring System as a Teacher!
                </p>
                
                <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-700 mb-4">Your Account Details:</h3>
                  <div className="text-left space-y-2">
                    <p><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
                    <p><span className="font-medium">Teacher ID:</span> {formData.teacherId}</p>
                    <p><span className="font-medium">University:</span> {formData.university}</p>
                    <p><span className="font-medium">Email:</span> {formData.email}</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-4 animate-pulse">
                    {countdown}
                  </div>
                  <p className="text-gray-600">
                    Redirecting to Teacher Dashboard in {countdown} seconds...
                  </p>
                  
                  <button
                    onClick={() => navigate('/teacher/dashboard')}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 inline-flex items-center gap-2"
                  >
                    Go to Dashboard Now
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error & Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center text-red-700">
                <div className="flex-shrink-0">⚠️</div>
                <div className="ml-3">
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center text-green-700">
                <div className="flex-shrink-0">✅</div>
                <div className="ml-3">
                  <p className="font-medium">{success}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Already have account */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/auth/teacher-login')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Login here
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            By registering, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherRegistration;