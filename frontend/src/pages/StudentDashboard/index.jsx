import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FaHome,
  FaBook,
  FaClipboardList,
  FaTrophy,
  FaUser,
  FaCog,
  FaSearch,
  FaBell,
  FaPlay,
  FaClock,
  FaChartLine
} from 'react-icons/fa';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import Sidebar from './components/Sidebar';
import NextExamCard from './components/NextExamCard';
import QuickStatsCard from './components/QuickStatsCard';
import AnnouncementsCard from './components/AnnouncementsCard';
import PerformanceGraph from './components/PerformanceGraph';
import AvailableExams from './components/AvailableExams';
import Header from './components/Header';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');

  // Get student data from localStorage and check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/student-login', { replace: true });
      return;
    }
    
    const studentData = localStorage.getItem('student');
    if (studentData) {
      try {
        const student = JSON.parse(studentData);
        setStudentName(`${student.firstName} ${student.lastName}`);
      } catch (e) {
        console.error('Error parsing student data:', e);
      }
    }
  }, [navigate]);

  // Fetch dashboard data with optimized caching to prevent rate limiting
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      const response = await dashboardAPI.getDashboard();
      // axiosClient already returns response.data, so just return it
      return response;
    },
    refetchOnWindowFocus: false, // Disabled to prevent excessive requests
    refetchOnMount: true, // Only refetch on mount
    refetchOnReconnect: false, // Disabled to prevent excessive requests
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes (increased from 30 seconds)
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    retryDelay: 2000, // Wait 2 seconds before retry
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading dashboard</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dashboard = dashboardData || {};

  // Fallback to localStorage student for avatar if dashboard payload misses it
  let student = dashboard.student || { name: studentName };
  try {
    const stored = localStorage.getItem('student');
    if (stored) {
      const parsed = JSON.parse(stored);
      student = {
        ...student,
        profileImage: student.profileImage || parsed.profileImage,
      };
    }
  } catch (e) {
    console.error('Error reading student from localStorage:', e);
  }

  const resolveAvatarUrl = (rawUrl) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    // Backend serves uploads
    if (rawUrl.startsWith('/uploads')) {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      return `${BACKEND_URL}${rawUrl}`;
    }
    return rawUrl;
  };
  const nextExam = dashboard.nextScheduledExam;
  const quickStats = dashboard.quickStats || {};
  const announcements = dashboard.announcements || [];
  const performanceTrends = dashboard.performanceTrends || [];
  const availableExams = dashboard.availableExams || [];

  // Debug logging
  console.log('Dashboard Data:', {
    dashboard,
    availableExams,
    availableExamsCount: availableExams?.length,
    nextExam,
    student
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          studentName={student.name || studentName}
          avatarUrl={resolveAvatarUrl(student.profileImage)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl font-semibold text-slate-900">
              Welcome, {student.name || studentName}!
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              ID: {student.universityId || 'N/A'}
            </p>
          </motion.div>

          {/* Top Row Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Next Scheduled Exam */}
            <div className="lg:col-span-1">
              <NextExamCard nextExam={nextExam} />
            </div>

            {/* Quick Stats */}
            <div className="lg:col-span-1">
              <QuickStatsCard stats={quickStats} />
            </div>

            {/* Announcements */}
            <div className="lg:col-span-1">
              <AnnouncementsCard announcements={announcements} />
            </div>
          </div>

          {/* Performance Trends */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <FaChartLine className="mr-2 text-sky-600" />
              Performance Trends
            </h2>
            <PerformanceGraph data={performanceTrends} />
          </div>

          {/* Available Exams */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <FaClipboardList className="mr-2 text-sky-600" />
              Available Exams
            </h2>
            <AvailableExams exams={availableExams} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;







