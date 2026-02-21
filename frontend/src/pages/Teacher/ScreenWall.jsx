import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaDesktop } from 'react-icons/fa';
import axiosClient from '../../services/axiosClient';
import { teacherAuthAPI } from '../../services/api/authAPI';
import screenSocket from '../../services/realtime/screenSocket';

const ScreenWall = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [frames, setFrames] = useState({});

  useEffect(() => {
    if (!teacherAuthAPI.isAuthenticated()) {
      navigate('/auth/teacher-login', { replace: true });
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosClient.get(
          `/v1/tests/${testId}/proctoring/participants`,
        );
        const payload = response?.data ?? response;
        setSession(payload);
        if (payload?.students?.[0]) {
          setActiveStudentId(payload.students[0].id);
        }
      } catch (e) {
        console.error('Failed to load screen wall session:', e);
        setError(e?.response?.data?.message || e?.message || 'Failed to load screens');
      } finally {
        setLoading(false);
      }
    };

    load();

    // Setup Socket.io for receiving screen frames
    if (!screenSocket.connected) {
      screenSocket.connect();
    }

    const teacherDataRaw = localStorage.getItem('teacherData');
    const teacherData = teacherDataRaw ? JSON.parse(teacherDataRaw) : null;
    const teacherId =
      teacherData?._id || teacherData?.id || teacherData?.teacherId || 'teacher';

    screenSocket.emit('proctoring:join', {
      testId,
      role: 'teacher',
      userId: teacherId,
    });

    const handleFrame = ({ studentId, image }) => {
      if (!studentId || !image) return;
      setFrames((prev) => ({
        ...prev,
        [studentId]: image,
      }));
    };

    screenSocket.on('screen:frame', handleFrame);

    return () => {
      screenSocket.off('screen:frame', handleFrame);
    };
  }, [navigate, testId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-600 text-sm font-medium">Unable to load student screens</p>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => navigate(`/teacher/proctoring/${testId}`)}
            className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700"
          >
            <FaArrowLeft className="w-3 h-3 mr-2" />
            Back to Proctoring
          </button>
        </div>
      </div>
    );
  }

  const { test, students } = session;
  const activeStudent = students?.find((s) => s.id === activeStudentId) || null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate(`/teacher/proctoring/${testId}`)}
            className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <FaArrowLeft className="w-3 h-3 mr-1" />
            Proctoring
          </button>
          <div>
            <p className="text-xs uppercase text-slate-500">Screen Proctoring</p>
            <h1 className="text-base sm:text-lg font-semibold text-slate-900">
              {test?.title || 'Exam'} – Screen View
            </h1>
            <p className="text-xs text-slate-500">
              {students?.length || 0} students • Click a screen to enlarge
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Screens grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {students && students.length > 0 ? (
                students.map((s) => {
                  const isActive = s.id === activeStudentId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveStudentId(s.id)}
                      className={`relative aspect-video w-full bg-black rounded-xl overflow-hidden border ${
                        isActive ? 'border-sky-500 ring-2 ring-sky-400' : 'border-slate-200'
                      }`}
                    >
                      {frames[s.id] ? (
                        <img
                          src={frames[s.id]}
                          alt={`${s.name} screen`}
                          className="absolute inset-0 w-full h-full object-contain bg-black"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FaDesktop className="w-10 h-10 text-slate-500" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 flex items-center justify-between">
                        <p className="text-[11px] text-white font-medium truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-200">
                          {s.branch || 'N/A'} • {s.section || 'N/A'}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full text-xs text-slate-500 text-center py-6">
                  No students allocated to this test.
                </div>
              )}
            </div>
          </div>

          {/* Enlarged view */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 h-full flex flex-col">
              <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                <FaDesktop className="text-sky-600" />
                <span>Focused Screen</span>
              </h2>
              {activeStudent ? (
                <>
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-3">
                    {frames[activeStudent.id] ? (
                      <img
                        src={frames[activeStudent.id]}
                        alt={`${activeStudent.name} screen large`}
                        className="absolute inset-0 w-full h-full object-contain bg-black"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FaDesktop className="w-12 h-12 text-slate-500" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5 flex items-center justify-between">
                      <p className="text-xs text-white font-medium truncate">{activeStudent.name}</p>
                      <p className="text-[11px] text-slate-200">
                        {activeStudent.branch || 'N/A'} • {activeStudent.section || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-800">Email: </span>
                      {activeStudent.email}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">Year: </span>
                      {activeStudent.currentYear ? `Year ${activeStudent.currentYear}` : 'N/A'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">Batch: </span>
                      {activeStudent.batchYear || 'N/A'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500 mt-4">Select a student from the grid to focus their screen.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScreenWall;



