import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaUserCircle } from 'react-icons/fa';
import Sidebar from '../StudentDashboard/components/Sidebar';
import Header from '../StudentDashboard/components/Header';
import { studentProfileAPI } from '../../services/api/studentProfileAPI';

const StudentProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: ''
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/student-login', { replace: true });
    }
  }, [navigate]);

  const {
    data: profileResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: studentProfileAPI.getProfile
  });

  useEffect(() => {
    const profile = profileResponse?.data || profileResponse;
    if (profile) {
      setFormState({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        mobileNumber: profile.mobileNumber || ''
      });
      if (profile.profileImage) {
        const rawUrl = profile.profileImage;
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const resolved =
          rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
            ? rawUrl
            : rawUrl.startsWith('/uploads')
            ? `${BACKEND_URL}${rawUrl}`
            : rawUrl;
        setPreviewUrl(resolved);
      }
    }
  }, [profileResponse]);

  const mutation = useMutation({
    mutationFn: studentProfileAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['studentProfile']);
      queryClient.invalidateQueries(['studentDashboard']);
      alert('Profile updated successfully');
    },
    onError: (err) => {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          'Failed to update profile. Please try again.'
      );
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('firstName', formState.firstName);
    formData.append('lastName', formState.lastName);
    formData.append('email', formState.email);
    formData.append('mobileNumber', formState.mobileNumber);
    if (profileImageFile) {
      formData.append('profileImage', profileImageFile);
    }
    mutation.mutate(formData);
  };

  const profile = profileResponse?.data || profileResponse;
  const studentName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : '';

  const headerAvatarUrl = (() => {
    if (!profile?.profileImage) return '';
    const rawUrl = profile.profileImage;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    if (rawUrl.startsWith('/uploads')) {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      return `${BACKEND_URL}${rawUrl}`;
    }
    return rawUrl;
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading profile</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const avatarContent = previewUrl ? (
    <img
      src={previewUrl}
      alt="Profile avatar"
      className="w-20 h-20 rounded-full object-cover"
    />
  ) : (
    <div className="w-20 h-20 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
      <FaUserCircle className="w-12 h-12" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          studentName={studentName || formState.firstName}
          avatarUrl={headerAvatarUrl}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">
              Profile
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              View and update your personal information.
            </p>

            {/* Avatar upload */}
            <div className="flex items-center gap-4 mb-6">
              {avatarContent}
              <div>
                <label className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  JPG, PNG up to 2MB. If not uploaded, a default avatar will be
                  used.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formState.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formState.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formState.mobileNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  placeholder="Enter your mobile number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/student/dashboard')}
                  className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="px-5 py-2 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {mutation.isLoading ? 'Saving...' : 'Update & Save'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentProfile;


