import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FaSearch,
  FaClock,
  FaCalendarAlt,
  FaTimesCircle,
  FaPlay,
  FaListUl,
  FaCode,
  FaRandom,
  FaCheckCircle,
  FaChartBar
} from 'react-icons/fa';
import { dashboardAPI } from '../../services/api/dashboardAPI';
import Sidebar from '../StudentDashboard/components/Sidebar';
import Header from '../StudentDashboard/components/Header';

const StudentAvailableExams = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch dashboard data to get available exams with optimized caching
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      const response = await dashboardAPI.getDashboard();
      return response;
    },
    refetchOnWindowFocus: false, // Disabled to prevent excessive requests
    refetchOnMount: true, // Only refetch on mount
    refetchOnReconnect: false, // Disabled to prevent excessive requests
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    retryDelay: 2000,
  });

  // Refetch when component becomes visible (returning from result page) - with debouncing
  useEffect(() => {
    let visibilityTimeout = null;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Debounce visibility change to prevent rapid refetches
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
        }
        visibilityTimeout = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
        }, 2000); // Wait 2 seconds before refetching
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
    };
  }, [queryClient]);

  // Remove attempted exams from available list
  const availableExams = (dashboardData?.availableExams || []).filter((exam) => !exam.hasAttempted);

  // Filter exams based on search query
  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableExams;
    }
    const query = searchQuery.toLowerCase();
    return availableExams.filter(exam =>
      exam.title?.toLowerCase().includes(query) ||
      exam.course?.toLowerCase().includes(query) ||
      exam.testType?.toLowerCase().includes(query)
    );
  }, [availableExams, searchQuery]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTestTypeIcon = (testType) => {
    const type = testType?.toLowerCase() || 'mcq';
    if (type === 'coding') return FaCode;
    if (type === 'hybrid') return FaRandom;
    return FaListUl; // MCQ
  };

  const getTestTypeColor = (testType) => {
    const type = testType?.toLowerCase() || 'mcq';
    if (type === 'coding') return 'bg-purple-100 text-purple-600 border-purple-200';
    if (type === 'hybrid') return 'bg-orange-100 text-orange-600 border-orange-200';
    return 'bg-sky-100 text-sky-600 border-sky-200'; // MCQ
  };

  const canStartExam = (exam) => {
    if (!exam.scheduledDate) return false;
    const now = new Date();
    const startDate = new Date(exam.scheduledDate);
    return startDate <= now;
  };

  const isExpired = (exam) => {
    if (!exam.windowCloseDate) return false;
    const now = new Date();
    const closeDate = new Date(exam.windowCloseDate);
    return closeDate < now;
  };

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
            <p className="text-red-600 mb-4">Error loading exams</p>
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

  const studentName = dashboardData?.student?.name || 'Student';
  const resolveAvatarUrl = (rawUrl) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    if (rawUrl.startsWith('/uploads')) {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      return `${BACKEND_URL}${rawUrl}`;
    }
    return rawUrl;
  };
  const avatarUrl = resolveAvatarUrl(dashboardData?.student?.profileImage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header studentName={studentName} avatarUrl={avatarUrl} />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              Available Exams
            </h1>
            <p className="text-sm text-slate-600">
              {filteredExams.length} {filteredExams.length === 1 ? 'exam' : 'exams'} available
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search exams by name, type, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Exams List */}
          {filteredExams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-slate-200">
              <p className="text-slate-500 text-lg">
                {searchQuery ? 'No exams found matching your search' : 'No available exams at the moment'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sky-600 hover:text-sky-700 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExams.map((exam, index) => {
                const TestTypeIcon = getTestTypeIcon(exam.testType);
                const testTypeColor = getTestTypeColor(exam.testType);
                const canStart = canStartExam(exam);
                const expired = isExpired(exam);

                return (
                  <motion.div
                    key={exam.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Left Section - Test Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg border ${testTypeColor}`}>
                              <TestTypeIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-slate-900 truncate">
                                {exam.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded font-medium ${testTypeColor}`}>
                                  {exam.testType || 'MCQ'}
                                </span>
                                {exam.course && exam.course !== 'General' && (
                                  <span className="text-xs text-slate-500">
                                    {exam.course}
                                  </span>
                                )}
                                {exam.hasAttempted && (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <FaCheckCircle className="w-3 h-3" />
                                    Attempted
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Test Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <FaCalendarAlt className="w-4 h-4 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-slate-700">Start:</span>{' '}
                                <span>{formatDateTime(exam.scheduledDate)}</span>
                              </div>
                            </div>
                            
                            {exam.windowCloseDate && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <FaTimesCircle className="w-4 h-4 flex-shrink-0" />
                                <div>
                                  <span className="font-medium text-slate-700">Closes:</span>{' '}
                                  <span>{formatDateTime(exam.windowCloseDate)}</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <FaClock className="w-4 h-4 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-slate-700">Duration:</span>{' '}
                                <span>{exam.duration} minutes</span>
                              </div>
                            </div>
                          </div>

                          {exam.description && (
                            <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                              {exam.description}
                            </p>
                          )}
                        </div>

                        {/* Right Section - Action Button */}
                        <div className="ml-6 flex flex-col items-end justify-between min-w-[140px]">
                          <div className="text-right mb-4">
                            <div className="text-sm font-semibold text-slate-700">
                              {exam.totalMarks} Marks
                            </div>
                            {exam.teacher && (
                              <div className="text-xs text-slate-500 mt-1">
                                {exam.teacher.name}
                              </div>
                            )}
                          </div>
                          
                          {exam.hasAttempted ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/student/results/${exam.id}`)}
                              className="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow flex items-center gap-2"
                            >
                              <FaChartBar className="w-3 h-3" />
                              View Result
                            </button>
                          ) : (
                          <button
                            type="button"
                            disabled={!canStart || expired}
                            onClick={() => !expired && canStart && navigate(`/student/exams/${exam.id}`)}
                            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                              expired
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : canStart
                                ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm hover:shadow'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {expired ? (
                              'Test Closed'
                            ) : canStart ? (
                              <span className="flex items-center gap-2">
                                <FaPlay className="w-3 h-3" />
                                Start Exam
                              </span>
                            ) : (
                              'Not Started'
                            )}
                          </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentAvailableExams;

