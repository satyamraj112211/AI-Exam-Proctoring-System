import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaChartBar,
  FaArrowRight,
  FaSearch,
  FaTrophy,
  FaPercent,
  FaHistory
} from 'react-icons/fa';
import Sidebar from './StudentDashboard/components/Sidebar';
import { testAPI } from '../services/api/testAPI';

const StudentResults = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // On mount: check auth and load attempts
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/student-login', { replace: true });
      return;
    }

    const loadAttempts = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await testAPI.getMyAttempts();
        const data = Array.isArray(response) ? response : [];
        // Sort newest first
        const sorted = [...data].sort(
          (a, b) => new Date(b?.submittedAt || 0).getTime() - new Date(a?.submittedAt || 0).getTime(),
        );
        setAttempts(sorted);
        console.log('StudentResults: loaded attempts', { count: sorted.length, sample: sorted[0] });
      } catch (e) {
        console.error('Error loading student results:', e);
        setError(e?.response?.data?.message || e?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    loadAttempts();
  }, [navigate]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (isPassed) => {
    if (isPassed) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FaCheckCircle className="mr-1" /> Passed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <FaTimesCircle className="mr-1" /> Failed
      </span>
    );
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-sky-600';
    if (percentage >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return attempts;
    const q = searchQuery.toLowerCase();
    return attempts.filter((r) =>
      r.testTitle?.toLowerCase().includes(q) ||
      r.course?.toLowerCase().includes(q) ||
      r.testType?.toLowerCase().includes(q)
    );
  }, [attempts, searchQuery]);

  const stats = {
    totalAttempts: filteredResults.length,
    avgPercentage: filteredResults.length
      ? filteredResults.reduce((sum, a) => sum + (a.percentage || 0), 0) / filteredResults.length
      : 0,
    bestScore: filteredResults.reduce((max, a) => Math.max(max, a.percentage || 0), 0),
    recentScore: filteredResults[0]?.percentage || 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-600" />
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
            <p className="text-red-600 mb-4">Error loading results</p>
            <p className="text-sm text-slate-500 mb-2">{error}</p>
            <button
              type="button"
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">My Results</h1>
              <p className="text-sm text-slate-600 mt-1">
                Review your completed tests and open detailed analytics for each attempt.
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Completed</p>
                  <FaCheckCircle className="text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">{attempts.length}</p>
                <p className="text-xs text-slate-500">Total submitted exams</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Average %</p>
                  <FaPercent className="text-sky-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {Math.round((stats.avgPercentage || 0) * 10) / 10}%
                </p>
                <p className="text-xs text-slate-500">Across all attempts</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Best Score</p>
                  <FaTrophy className="text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {Math.round(stats.bestScore || 0)}%
                </p>
                <p className="text-xs text-slate-500">Highest percentage</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Latest</p>
                  <FaHistory className="text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {Math.round(stats.recentScore || 0)}%
                </p>
                <p className="text-xs text-slate-500">Most recent attempt</p>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search results by test name..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400 bg-white text-slate-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* No results state */}
            {filteredResults.length === 0 ? (
              <div className="mt-8 bg-white rounded-lg border border-slate-200 p-8 text-center">
                <p className="text-slate-600 font-medium mb-2">No results yet</p>
                <p className="text-sm text-slate-500 mb-4">
                  Once you complete exams, they will appear here with detailed analytics.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/student/available-exams')}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700"
                >
                  Go to Available Exams
                </button>
              </div>
            ) : (
              <div className="mt-4 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <div className="col-span-4">Test</div>
                  <div className="col-span-2">Score</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Submitted</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredResults.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="px-4 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-slate-50 transition-colors"
                    >
                      {/* Test Info */}
                      <div className="col-span-4">
                        <p className="text-sm font-medium text-slate-900">{attempt.testTitle}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {attempt.testType?.toUpperCase() || 'MCQ'} • {attempt.course || 'General'}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="col-span-2">
                        <p className={`text-sm font-semibold ${getPercentageColor(attempt.percentage || 0)}`}>
                          {Math.round(attempt.percentage || 0)}%
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {attempt.totalMarksObtained}/{attempt.totalMarksPossible} marks
                        </p>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center">
                        {getStatusBadge(attempt.isPassed)}
                      </div>

                      {/* Submitted At */}
                      <div className="col-span-2">
                        <p className="text-xs text-slate-600">{formatDateTime(attempt.submittedAt)}</p>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex justify-start md:justify-end">
                        <button
                          type="button"
                          onClick={() => navigate(`/student/results/${attempt.testId}`)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md border border-sky-600 text-sky-600 text-xs font-medium hover:bg-sky-600 hover:text-white transition-colors"
                        >
                          <FaChartBar className="w-3 h-3 mr-1.5" />
                          View Analytics
                          <FaArrowRight className="w-3 h-3 ml-1" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentResults;