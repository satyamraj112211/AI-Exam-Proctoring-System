import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaUser,
  FaUniversity,
  FaIdCard,
  FaLock,
  FaCheck,
  FaArrowLeft,
  FaSpinner,
} from 'react-icons/fa';
import axiosClient from '../../../services/axiosClient';
import { academicsAPI } from '../../../services/api/academicsAPI';

const Step3Registration = ({ email, onPrev, tempToken }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    institutionType: 'university',
    institutionId: '',
    branchCode: '',
    batchYear: '',
    currentYear: '',
    section: '',
    password: '',
    confirmPassword: '',
  });
  const [institutions, setInstitutions] = useState([]);
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstitutions(formData.institutionType);
  }, [formData.institutionType]);

  const fallbackInstitutions = [
    // Universities
    ...[
      'Indian Institute of Science (IISc), Bangalore',
      'Jawaharlal Nehru University (JNU), Delhi',
      'Banaras Hindu University (BHU), Varanasi',
      'University of Delhi (DU)',
      'Jadavpur University, Kolkata',
      'Jamia Millia Islamia (JMI), Delhi',
      'Hyderabad University (UoH)',
      'Savitribai Phule Pune University',
      'Aligarh Muslim University (AMU)',
      'Manipal Academy of Higher Education',
      'Birla Institute of Technology & Science (BITS Pilani)',
      'Vellore Institute of Technology (VIT), Vellore',
      'Anna University, Chennai',
      'Calcutta University',
      'Mumbai University',
      'Osmania University, Hyderabad',
      'Amrita Vishwa Vidyapeetham',
      'Lovely Professional University (LPU)',
      'SRM Institute of Science & Technology',
    ].map((name) => ({
      _id: `uni-${name}`,
      name,
      code: name.split('(')[0].trim().toUpperCase().slice(0, 12),
      type: 'university',
    })),
    // Colleges (tech-only branches allowed later)
    ...[
      'St. Stephen’s College, Delhi',
      'Hindu College, Delhi',
      'Miranda House, Delhi',
      'Hansraj College, Delhi',
      'Sri Venkateswara College, Delhi',
      'Loyola College, Chennai',
      'Presidency College, Chennai',
      'St. Xavier’s College, Mumbai',
      'St. Xavier’s College, Kolkata',
      'Christ College (Autonomous), Irinjalakuda',
      'Lady Shri Ram College (LSR), Delhi',
      'Ramjas College, Delhi',
      'Kirori Mal College, Delhi',
      'Joseph’s College, Bangalore',
      'Fergusson College, Pune',
      'MCC – Madras Christian College',
      'Symbiosis College of Arts & Commerce, Pune',
      'H.R. College of Commerce & Economics, Mumbai',
      'Elphinstone College, Mumbai',
      'Mount Carmel College, Bengaluru',
    ].map((name) => ({
      _id: `col-${name}`,
      name,
      code: name.split(' ')[0].toUpperCase().slice(0, 12),
      type: 'college',
    })),
  ];

  const branchCatalog = [
    { code: 'PHY', name: 'Physics', category: 'non-tech' },
    { code: 'CHEM', name: 'Chemistry', category: 'non-tech' },
    { code: 'MATH', name: 'Mathematics', category: 'non-tech' },
    { code: 'BIO', name: 'Biology / Life Sciences', category: 'non-tech' },
    { code: 'BT', name: 'Biotechnology', category: 'non-tech' },
    { code: 'BCHEM', name: 'Biochemistry', category: 'non-tech' },
    { code: 'MB', name: 'Microbiology', category: 'non-tech' },
    { code: 'ENV', name: 'Environmental Science', category: 'non-tech' },
    { code: 'STAT', name: 'Statistics', category: 'non-tech' },
    { code: 'GEO', name: 'Geology', category: 'non-tech' },
    { code: 'ASTRO', name: 'Astronomy / Astrophysics', category: 'non-tech' },
    { code: 'CSE', name: 'Computer Science & Engineering (CSE)', category: 'tech' },
    { code: 'IT', name: 'Information Technology (IT)', category: 'tech' },
    { code: 'ECE', name: 'Electronics & Communication Engineering (ECE)', category: 'tech' },
    { code: 'EEE', name: 'Electrical Engineering (EEE)', category: 'tech' },
    { code: 'ME', name: 'Mechanical Engineering', category: 'tech' },
    { code: 'CE', name: 'Civil Engineering', category: 'tech' },
    { code: 'AE', name: 'Aerospace Engineering', category: 'tech' },
    { code: 'CHE', name: 'Chemical Engineering', category: 'tech' },
    { code: 'BTE', name: 'Biotechnology Engineering', category: 'tech' },
    { code: 'MTE', name: 'Metallurgical Engineering', category: 'tech' },
    { code: 'RAI', name: 'Robotics / AI / Data Science', category: 'tech' },
    { code: 'ENG', name: 'English', category: 'non-tech' },
    { code: 'HIS', name: 'History', category: 'non-tech' },
    { code: 'PSCI', name: 'Political Science', category: 'non-tech' },
    { code: 'SOC', name: 'Sociology', category: 'non-tech' },
    { code: 'PSY', name: 'Psychology', category: 'non-tech' },
    { code: 'PHIL', name: 'Philosophy', category: 'non-tech' },
    { code: 'GEOG', name: 'Geography', category: 'non-tech' },
    { code: 'LING', name: 'Linguistics', category: 'non-tech' },
    { code: 'FA', name: 'Fine Arts', category: 'non-tech' },
    { code: 'ANTH', name: 'Anthropology', category: 'non-tech' },
    { code: 'PA', name: 'Performing Arts', category: 'non-tech' },
    { code: 'BCOM', name: 'B.Com', category: 'non-tech' },
    { code: 'BBA', name: 'BBA / MBA', category: 'non-tech' },
    { code: 'ECO', name: 'Economics', category: 'non-tech' },
    { code: 'FIN', name: 'Finance', category: 'non-tech' },
    { code: 'MKT', name: 'Marketing', category: 'non-tech' },
    { code: 'IB', name: 'International Business', category: 'non-tech' },
    { code: 'HR', name: 'Human Resource Management', category: 'non-tech' },
    { code: 'OPS', name: 'Operations & Supply Chain', category: 'non-tech' },
    { code: 'ENT', name: 'Entrepreneurship', category: 'non-tech' },
    { code: 'BCA', name: 'BCA / MCA', category: 'tech' },
    { code: 'DS', name: 'Data Science', category: 'tech' },
    { code: 'AI', name: 'Artificial Intelligence', category: 'tech' },
    { code: 'CYBER', name: 'Cybersecurity', category: 'tech' },
    { code: 'CLOUD', name: 'Cloud Computing', category: 'tech' },
    { code: 'SWE', name: 'Software Engineering', category: 'tech' },
    { code: 'LAW', name: 'Law (LLB / LLM)', category: 'non-tech' },
    { code: 'BED', name: 'B.Ed', category: 'non-tech' },
    { code: 'MED', name: 'M.Ed / Educational Research', category: 'non-tech' },
    { code: 'IR', name: 'International Relations', category: 'non-tech' },
    { code: 'PP', name: 'Public Policy', category: 'non-tech' },
    { code: 'SW', name: 'Social Work', category: 'non-tech' },
    { code: 'JMC', name: 'Journalism & Mass Communication', category: 'non-tech' },
    { code: 'DM', name: 'Digital Media / Media Studies', category: 'non-tech' },
    { code: 'FTV', name: 'Film & Television', category: 'non-tech' },
    { code: 'CORP', name: 'Corporate Communication', category: 'non-tech' },
  ];

  const fetchInstitutions = async (type) => {
    setFetching(true);
    setInstitutions([]);
    try {
      const res = await academicsAPI.getInstitutions(type);
      setInstitutions(res || []);
    } catch (err) {
      console.error('Failed to fetch institutions:', err);
      setInstitutions(fallbackInstitutions.filter((i) => i.type === type));
      setError('Using offline institution list. Please proceed.');
    } finally {
      setFetching(false);
    }
  };

  const fetchStructure = async (institutionId) => {
    if (!institutionId) {
      setStructure(null);
      return;
    }
    try {
      const res = await academicsAPI.getStructure(institutionId);
      setStructure(res);
    } catch (err) {
      console.error('Failed to fetch structure:', err);
      setError('Unable to load branches/sections. Please try another institution.');
      setStructure(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'institutionType'
        ? {
            institutionId: '',
            branchCode: '',
            batchYear: '',
            currentYear: '',
            section: '',
          }
        : {}),
      ...(name === 'institutionId'
        ? {
            branchCode: '',
            batchYear: '',
            currentYear: '',
            section: '',
          }
        : {}),
      ...(name === 'branchCode'
        ? {
            batchYear: '',
            currentYear: '',
            section: '',
          }
        : {}),
      ...(name === 'batchYear' || name === 'currentYear'
        ? { section: '' }
        : {}),
    }));

    if (name === 'institutionId') {
      fetchStructure(value);
    }

    // Auto-select first available section when batch year + branch present
    if ((name === 'batchYear' || name === 'branchCode') && formData.batchYear && formData.branchCode) {
      const prefix = `${name === 'batchYear' ? value : formData.batchYear}${name === 'branchCode' ? value.toUpperCase() : formData.branchCode.toUpperCase()}`;
      setFormData((prev) => ({
        ...prev,
        section: `${prefix}1`,
      }));
    }

    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
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

  const branchOptions = useMemo(() => {
    const base =
      structure?.branches && structure.branches.length
        ? structure.branches
        : branchCatalog;
    return formData.institutionType === 'college'
      ? base.filter((b) => b.category === 'tech')
      : base;
  }, [structure, formData.institutionType, branchCatalog]);

  const yearOptions = useMemo(() => {
    if (!branchOptions.length) return [];
    const branch = branchOptions.find((b) => b.code === formData.branchCode);
    return branch?.years || [];
  }, [branchOptions, formData.branchCode]);

  const sectionOptions = useMemo(() => {
    const yearVal = formData.batchYear || formData.currentYear;
    if (!yearVal || !formData.branchCode) return [];
    const prefix = `${yearVal}${formData.branchCode.toUpperCase()}`;
    return Array.from({ length: 30 }, (_, idx) => `${prefix}${idx + 1}`);
  }, [formData.batchYear, formData.currentYear, formData.branchCode]);

  const validateForm = () => {
    const {
      firstName,
      lastName,
      institutionType,
      institutionId,
      branchCode,
      batchYear,
      currentYear,
      section,
      password,
      confirmPassword,
    } = formData;

    if (
      !firstName ||
      !lastName ||
      !institutionType ||
      !institutionId ||
      !branchCode ||
      !batchYear ||
      !currentYear ||
      !section ||
      !password ||
      !confirmPassword
    ) {
      setError('All fields are required');
      return false;
    }

    if (Number.isNaN(Number(batchYear)) || Number.isNaN(Number(currentYear))) {
      setError('Batch year and current year must be valid numbers');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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
      const response = await axiosClient.post(
        '/v1/auth/register',
        {
          email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          institutionType: formData.institutionType,
          institutionId: formData.institutionId,
          branchCode: formData.branchCode.toUpperCase(),
          batchYear: Number(formData.batchYear),
          currentYear: Number(formData.currentYear),
          section: formData.section.toUpperCase(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        },
      );

      const payload = response.data || response;
      const already = payload?.message?.toLowerCase().includes('already registered');
      if (payload?.success || payload?.data?.token || already) {
        // Clear any existing session and redirect to student login
        localStorage.removeItem('token');
        localStorage.removeItem('student');
        setError(already ? 'Student already registered. Redirecting to login…' : '');
        setTimeout(() => navigate('/auth/student-login'), 200);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
      if (msg.toLowerCase().includes('already registered')) {
        setTimeout(() => navigate('/auth/student-login'), 400);
      }
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
          Step 3: Fill in your details to complete registration
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="John"
                required
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Doe"
                required
              />
            </div>
          </div>
        </div>

        {/* Institution Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Institution Type
            </label>
            <div className="flex space-x-3">
              {['university', 'college'].map((type) => (
                <label
                  key={type}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer ${
                    formData.institutionType === type
                      ? 'border-blue-500 text-blue-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="institutionType"
                    value={type}
                    checked={formData.institutionType === type}
                    onChange={handleChange}
                  />
                  <span className="capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Institution Selection */}
        <div>
          <label htmlFor="institutionId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {formData.institutionType === 'college' ? 'College' : 'University'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUniversity className="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="institutionId"
              name="institutionId"
              value={formData.institutionId}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white appearance-none"
              required
              disabled={fetching}
            >
              <option value="">{fetching ? 'Loading...' : 'Select your institution'}</option>
              {institutions.map((inst) => (
                <option key={inst._id || inst.id} value={inst._id || inst.id}>
                  {inst.name} ({inst.code})
                </option>
              ))}
            </select>
          </div>
          {fetching && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading institutions...</p>
          )}
        </div>

        {/* Branch Selection */}
        <div>
          <label htmlFor="branchCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Branch
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaIdCard className="h-5 w-5 text-gray-400" />
            </div>
            <input
              list="branch-options"
              id="branchCode"
              name="branchCode"
              value={formData.branchCode}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="e.g., CSE"
              required
              disabled={!formData.institutionId || branchOptions.length === 0}
            />
            <datalist id="branch-options">
              {branchOptions.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </datalist>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {branchOptions.length
              ? 'Choose a branch available at the selected institution.'
              : 'Select an institution to load branches.'}
          </p>
        </div>

        {/* Batch Year and Current Year */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="batchYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Batch Year (Joining)
            </label>
            <input
              type="number"
              id="batchYear"
              name="batchYear"
              value={formData.batchYear}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="e.g., 2024"
              required
              min="1900"
              max="2100"
              disabled={!formData.branchCode}
              list="year-options"
            />
            <datalist id="year-options">
              {yearOptions.map((y) => (
                <option key={y.label} value={y.label} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="currentYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Year (1-8)
            </label>
            <input
              type="number"
              id="currentYear"
              name="currentYear"
              value={formData.currentYear}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="e.g., 2"
              required
              min="1"
              max="8"
              disabled={!formData.branchCode}
            />
          </div>
        </div>

        {/* Section */}
        <div>
          <label htmlFor="section" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Section
          </label>
          <input
            type="text"
            id="section"
            name="section"
            value={formData.section}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="e.g., A"
            required
            disabled={!formData.branchCode || (!formData.batchYear && !formData.currentYear)}
            list="section-options"
          />
          <datalist id="section-options">
            {sectionOptions.map((s) => (
              <option key={s.name || s} value={s.name || s} />
            ))}
          </datalist>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Select from available sections or type if allowed by your institution.
          </p>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>
          
          {/* Password Strength Meter */}
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
              <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center">
                  <FaCheck className={`h-3 w-3 mr-2 ${formData.password.length >= 6 ? 'text-green-500' : 'text-gray-400'}`} />
                  At least 6 characters
                </li>
                <li className="flex items-center">
                  <FaCheck className={`h-3 w-3 mr-2 ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`} />
                  One uppercase letter
                </li>
                <li className="flex items-center">
                  <FaCheck className={`h-3 w-3 mr-2 ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`} />
                  One number
                </li>
                <li className="flex items-center">
                  <FaCheck className={`h-3 w-3 mr-2 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`} />
                  One special character
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
              <FaCheck className="h-3 w-3 mr-1" />
              Passwords match
            </p>
          )}
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
                <span>Registering...</span>
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