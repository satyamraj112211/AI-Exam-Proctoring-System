import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaVideo,
  FaDesktop,
  FaComments,
  FaArrowLeft,
} from 'react-icons/fa';
import axiosClient from '../../services/axiosClient';
import { teacherAuthAPI } from '../../services/api/authAPI';

const ProctoringSession = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!teacherAuthAPI.isAuthenticated()) {
      navigate('/auth/teacher-login', { replace: true });
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosClient.get(`/v1/tests/${testId}/proctoring/participants`);
        const payload = response?.data ?? response;
        setSession(payload);
      } catch (e) {
        console.error('Failed to load proctoring session:', e);
        setError(e?.response?.data?.message || e?.message || 'Failed to load proctoring session');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-600 text-sm font-medium">Unable to open proctoring session</p>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/teacher/dashboard')}
            className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700"
          >
            <FaArrowLeft className="w-3 h-3 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { test, students } = session;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/dashboard')}
            className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <FaArrowLeft className="w-3 h-3 mr-1" />
            Dashboard
          </button>
          <div>
            <p className="text-xs uppercase text-slate-500">Proctoring Session</p>
            <h1 className="text-base sm:text-lg font-semibold text-slate-900">
              {test?.title || 'Exam'}
            </h1>
            <p className="text-xs text-slate-500">
              {test?.course || 'General'} •{' '}
              {test?.scheduledDate ? new Date(test.scheduledDate).toLocaleString() : 'N/A'} •{' '}
              {test?.duration ? `${test.duration} min` : 'Duration N/A'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2 text-xs text-slate-500">
          <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {students?.length || 0} students allocated
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Proctoring mode options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-5 flex flex-col space-y-2">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-purple-100 text-purple-600">
                <FaVideo className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Video Proctoring</h2>
              <p className="text-xs text-slate-500">
                Monitor student webcams in real-time for suspicious movements and identity verification.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/teacher/proctoring/${testId}/video`)}
                className="mt-2 inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium bg-purple-600 text-white hover:bg-purple-700"
              >
                Open Video Grid
              </button>
            </div>

            <div className="bg-white rounded-xl border border-sky-200 shadow-sm p-5 flex flex-col space-y-2">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-sky-100 text-sky-600">
                <FaDesktop className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Screen Proctoring</h2>
              <p className="text-xs text-slate-500">
                Track student screen activity, tabs, and window focus during the exam session.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/teacher/proctoring/${testId}/screens`)}
                className="mt-2 inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium bg-sky-600 text-white hover:bg-sky-700"
              >
                Open Screen View
              </button>
            </div>

            <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 flex flex-col space-y-2">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600">
                <FaComments className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Chat</h2>
              <p className="text-xs text-slate-500">
                Communicate with students securely for clarifications and incident handling.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/teacher/proctoring/${testId}/chat`)}
                className="mt-2 inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Open Chat Panel
              </button>
            </div>
          </div>

          {/* Students list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Allocated Students</h2>
              <p className="text-xs text-slate-500">
                Name, email, branch, year and section for each student allocated to this test.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    {['Name', 'Email', 'Branch', 'Year', 'Section', 'Batch'].map((head) => (
                      <th
                        key={head}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {students && students.length > 0 ? (
                    students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-900">{s.name}</td>
                        <td className="px-4 py-2 text-slate-600">{s.email}</td>
                        <td className="px-4 py-2 text-slate-600">{s.branch || 'N/A'}</td>
                        <td className="px-4 py-2 text-slate-600">
                          {s.currentYear ? `Year ${s.currentYear}` : 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-slate-600">{s.section || 'N/A'}</td>
                        <td className="px-4 py-2 text-slate-600">{s.batchYear || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-xs text-slate-500"
                      >
                        No students allocated to this test.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProctoringSession;


