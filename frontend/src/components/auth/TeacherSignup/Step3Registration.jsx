import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaUserTie,
  FaUniversity,
  FaIdCard,
  FaLock,
  FaCheck,
  FaArrowLeft,
  FaSpinner
} from 'react-icons/fa';
import axiosClient from '../../../services/axiosClient';
import { teacherAuthAPI } from '../../../services/api/authAPI';

const Step3Registration = ({ email, onPrev, verified }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    teacherId: '',
    university: '',
    password: '',
    confirmPassword: ''
  });
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const res = await axiosClient.get('/auth/universities');
        if (res?.success && Array.isArray(res.data)) {
          setUniversities(res.data);
        }
      } catch (err) {
        setError('Unable to load universities. Please try again.');
      } finally {
        setFetching(false);
      }
    };
    loadUniversities();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
    if (error) setError('');
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const validateForm = () => {
    const { firstName, lastName, teacherId, university, password, confirmPassword } = formData;
    if (!verified) {
      setError('Please verify your email first.');
      return false;
    }
    if (!firstName || !lastName || !teacherId || !university || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    if (!/^[A-Z0-9]{6,12}$/.test(teacherId.toUpperCase())) {
      setError('Teacher ID must be 6-12 uppercase letters or numbers');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (passwordStrength < 50) {
      setError('Please choose a stronger password');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        email,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        teacherId: formData.teacherId.trim().toUpperCase(),
        university: formData.university,
        password: formData.password,
        passwordConfirm: formData.confirmPassword
      };
      const response = await teacherAuthAPI.register(payload);
      if (response?.success) {
        navigate('/teacher/registration-success', { state: { teacher: response.data?.teacher } });
      } else {
        setError(response?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Complete Your Profile
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Step 3: Provide your details to finalize registration
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <div className="relative">
              <FaUserTie className="absolute inset-y-0 left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="John"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teacher ID
            </label>
            <div className="relative">
              <FaIdCard className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white uppercase"
                placeholder="TEACH001"
                maxLength={12}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              6-12 alphanumeric characters (auto uppercased)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              University
            </label>
            <div className="relative">
              <FaUniversity className="absolute left-3 top-3 text-gray-400" />
              <select
                name="university"
                value={formData.university}
                onChange={handleChange}
                disabled={fetching}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white appearance-none"
              >
                <option value="">Select your university</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.name}>
                    {uni.name} ({uni.code})
                  </option>
                ))}
              </select>
            </div>
            {fetching && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading universities...</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="At least 8 characters"
              />
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Password strength:</span>
                  <span className="text-sm font-medium">{passwordStrength}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Re-enter password"
              />
            </div>
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                <FaCheck className="h-3 w-3 mr-1" />
                Passwords match
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
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
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Completing...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <FaCheck />
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Step3Registration;

























