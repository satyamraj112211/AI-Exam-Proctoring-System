import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaChalkboardTeacher,
  FaVideo,
  FaClock,
  FaListUl,
  FaChartBar,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaCalendarAlt,
  FaUserGraduate,
} from 'react-icons/fa';
import { teacherAuthAPI } from '../../services/api/authAPI';
import { testAPI } from '../../services/api/testAPI';
import NotificationBell from '../../components/NotificationBell';

const MOCK_TIMETABLE = [
  {
    id: 't1',
    time: '09:00 – 10:00',
    label: 'CSE – 3rd Year • Data Structures (Lecture)',
    type: 'lecture',
  },
  {
    id: 't2',
    time: '10:30 – 12:00',
    label: 'Proctored Exam • MID TERM – CSE 3rd Year',
    type: 'exam',
  },
  {
    id: 't3',
    time: '14:00 – 15:00',
    label: 'CSE – 2nd Year • DBMS (Online Class)',
    type: 'online',
  },
];

const TeacherSidebar = ({ active, onNavigate, onLogout }) => {
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: FaChalkboardTeacher },
    { key: 'proctoring', label: 'Exam Proctoring', icon: FaVideo },
    { key: 'results', label: 'Result Analysis', icon: FaChartBar },
    { key: 'classes', label: 'Online Classes', icon: FaListUl },
    { key: 'profile', label: 'Profile', icon: FaUserCircle },
    { key: 'settings', label: 'Settings', icon: FaCog },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col shadow-sm">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
          <FaChalkboardTeacher className="text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">VirtualXam</p>
          <p className="text-xs text-slate-500">Teacher Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          <FaSignOutAlt className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [teacher, setTeacher] = useState(null);
  const [proctoredExams, setProctoredExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examsError, setExamsError] = useState('');

  useEffect(() => {
    // Ensure teacher is authenticated
    if (!teacherAuthAPI.isAuthenticated()) {
      navigate('/auth/teacher-login', { replace: true });
      return;
    }
    const data = teacherAuthAPI.getCurrentTeacher();
    setTeacher(data);

    let isMounted = true;
    let loadTimeout = null;

    // Load tests allocated to this teacher (owned tests) with debouncing
    const loadExams = async () => {
      if (!isMounted) return;
      
      try {
        setLoadingExams(true);
        setExamsError('');
        const tests = await testAPI.list();
        const allTests = Array.isArray(tests) ? tests : [];

        if (!isMounted) return;

        // Helper to determine live status from time window
        const computePhase = (start, end, rawStatus) => {
          if (!start) return 'upcoming';
          const now = new Date();
          const startDate = new Date(start);
          const endDate = end ? new Date(end) : null;

          if (now < startDate) return 'upcoming';
          if (endDate && now > endDate) return 'completed';
          // If no explicit end, also use rawStatus when available
          if (rawStatus && rawStatus.toLowerCase() === 'completed') return 'completed';
          return 'ongoing';
        };

        // Map to proctoring-friendly shape
        const mapped = allTests.map((item) => {
          const startDate = item.schedule?.start || item.scheduledDate;
          const windowClose = item.schedule?.windowClose || item.windowCloseDate || null;
          const duration = item.schedule?.duration || item.duration;

          const studentsCount =
            item.studentCount ||
            item.allocations?.stats?.studentCount ||
            item.allowedStudents?.length ||
            0;

          const phase = computePhase(startDate, windowClose, item.status);

          return {
            id: item.id || item._id,
            title: item.name || item.title,
            course: item.type || item.course || 'Exam',
            startTime: startDate,
            endTime: windowClose || startDate,
            duration,
            studentsAssigned: studentsCount,
            status: phase,
          };
        });

        if (isMounted) {
          setProctoredExams(mapped);
          console.log('TeacherDashboard: loaded proctored exams', { count: mapped.length, exams: mapped });
        }
      } catch (err) {
        console.error('Failed to load teacher proctored exams', err);
        if (isMounted) {
          setExamsError(err?.message || 'Failed to load exams');
        }
      } finally {
        if (isMounted) {
          setLoadingExams(false);
        }
      }
    };

    // Initial load
    loadExams();

    // Refresh exams periodically but with longer interval to prevent rate limiting
    const refreshInterval = setInterval(() => {
      if (isMounted && !loadTimeout) {
        loadExams();
      }
    }, 60000); // Every 60 seconds instead of immediate

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
      if (loadTimeout) {
        clearTimeout(loadTimeout);
      }
    };
  }, [navigate]);

  const handleLogout = () => {
    teacherAuthAPI.logout();
    navigate('/auth/teacher-login', { replace: true });
  };

  const todayTimetable = useMemo(() => MOCK_TIMETABLE, []);

  const renderDashboardOverview = () => {
    return (
      <div className="space-y-6">
        {/* Top row: summary + timetable */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FaVideo className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Proctored Exams Today</p>
                  <p className="text-xl font-bold text-slate-900">
                    {proctoredExams.filter((e) => e.status === 'ongoing').length}
                  </p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                  <FaCalendarAlt className="text-sky-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Scheduled Exams</p>
                  <p className="text-xl font-bold text-slate-900">
                    {proctoredExams.filter((e) => e.status === 'upcoming').length}
                  </p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FaUserGraduate className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Students Assigned</p>
                  <p className="text-xl font-bold text-slate-900">
                    {proctoredExams.reduce((sum, e) => sum + (e.studentsAssigned || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Proctored exams list */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <FaVideo className="text-purple-600" />
                  <span>Proctored Exams</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveSection('proctoring')}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {proctoredExams.map((exam) => {
                  const badgeClass =
                    exam.status === 'ongoing'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : exam.status === 'completed'
                      ? 'bg-slate-50 text-slate-600 border border-slate-200'
                      : 'bg-sky-50 text-sky-700 border border-sky-200';
                  const badgeLabel =
                    exam.status === 'ongoing'
                      ? 'In Progress'
                      : exam.status === 'completed'
                      ? 'Over'
                      : 'Upcoming';

                  return (
                    <div key={exam.id} className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{exam.title}</p>
                        <p className="text-xs text-slate-500">
                          {exam.course} • {new Date(exam.startTime).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-slate-500">{exam.studentsAssigned} students</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {proctoredExams.length === 0 && (
                  <div className="px-5 py-6 text-center text-sm text-slate-500">No exams assigned yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Today timetable */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <FaClock className="text-sky-600" />
                <span>Today&apos;s Timetable</span>
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {todayTimetable.map((slot) => (
                <div key={slot.id} className="px-5 py-4">
                  <p className="text-xs font-semibold text-slate-500">{slot.time}</p>
                  <p className="text-sm font-medium text-slate-900 mt-1">{slot.label}</p>
                  <span
                    className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      slot.type === 'exam'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : slot.type === 'online'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {slot.type === 'exam'
                      ? 'Proctored Exam'
                      : slot.type === 'online'
                      ? 'Online Class'
                      : 'Lecture'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProctoring = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
            <FaVideo className="text-purple-600" />
            <span>Exam Proctoring</span>
          </h1>
          <p className="text-xs text-slate-500">All exams assigned to you with schedule and student counts.</p>
        </div>
        {examsError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
            {examsError}
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="col-span-4">Exam</div>
            <div className="col-span-3">Schedule</div>
            <div className="col-span-2">Students</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          <div className="divide-y divide-slate-100">
            {loadingExams && (
              <div className="px-5 py-6 text-center text-sm text-slate-500">Loading exams...</div>
            )}
            {!loadingExams && proctoredExams.length === 0 && !examsError && (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                No exams assigned for proctoring yet.
              </div>
            )}
            {!loadingExams && proctoredExams.map((exam) => (
              <div
                key={exam.id}
                className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-slate-50 transition-colors"
              >
                <div className="col-span-4">
                  <p className="text-sm font-medium text-slate-900">{exam.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{exam.course}</p>
                </div>
                <div className="col-span-3 text-xs text-slate-600">
                  <p>{new Date(exam.startTime).toLocaleString()}</p>
                  <p className="text-slate-400">to {new Date(exam.endTime).toLocaleTimeString()}</p>
                </div>
                <div className="col-span-2 text-sm text-slate-700">{exam.studentsAssigned} students</div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      exam.status === 'ongoing'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : exam.status === 'completed'
                        ? 'bg-slate-50 text-slate-600 border border-slate-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}
                  >
                    {exam.status === 'ongoing'
                      ? 'In Progress'
                      : exam.status === 'completed'
                      ? 'Over'
                      : 'Upcoming'}
                  </span>
                </div>
                <div className="col-span-1 flex justify-start md:justify-end">
                  <button
                    type="button"
                    disabled={exam.status !== 'ongoing'}
                    onClick={() => {
                      if (exam.status === 'ongoing') {
                        navigate(`/teacher/proctoring/${exam.id}`);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                      exam.status === 'ongoing'
                        ? 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white'
                        : 'border-slate-300 text-slate-400 cursor-not-allowed bg-slate-50'
                    }`}
                  >
                    Start Proctoring
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
          <FaChartBar className="text-emerald-600" />
          <span>Result Analysis</span>
        </h1>
        <p className="text-xs text-slate-500">
          High level overview of exam performance. Connect to backend analytics when ready.
        </p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-sm text-slate-600">
        <p>
          Result analytics will appear here – including per-exam statistics, student-wise performance, and behavior
          flags. For now, this section is a structured placeholder ready to be wired to your analytics APIs.
        </p>
      </div>
    </div>
  );

  const renderOnlineClasses = () => (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <FaListUl className="w-7 h-7 text-slate-500" />
      </div>
      <h1 className="text-xl font-semibold text-slate-900 mb-2">Online Classes</h1>
      <p className="text-sm text-slate-500 max-w-md">
        The online classes module will let you schedule and manage live classes directly from VirtualXam.
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-600">Coming soon...</p>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
        <FaUserCircle className="text-slate-600" />
        <span>Profile</span>
      </h1>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <p className="text-sm text-slate-600 mb-4">
          Basic teacher information loaded from your account. Expand this section to support editing when needed.
        </p>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold text-slate-800">Name: </span>
            <span className="text-slate-700">
              {teacher?.firstName} {teacher?.lastName}
            </span>
          </p>
          <p>
            <span className="font-semibold text-slate-800">Email: </span>
            <span className="text-slate-700">{teacher?.email}</span>
          </p>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
        <FaCog className="text-slate-600" />
        <span>Settings</span>
      </h1>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-sm text-slate-600">
        <p>This section will allow configuring proctoring defaults, notification preferences, and other settings.</p>
      </div>
    </div>
  );

  let content;
  if (activeSection === 'proctoring') content = renderProctoring();
  else if (activeSection === 'results') content = renderResults();
  else if (activeSection === 'classes') content = renderOnlineClasses();
  else if (activeSection === 'profile') content = renderProfile();
  else if (activeSection === 'settings') content = renderSettings();
  else content = renderDashboardOverview();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <TeacherSidebar active={activeSection} onNavigate={setActiveSection} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {activeSection === 'dashboard'
                ? 'Teacher Dashboard'
                : activeSection === 'proctoring'
                ? 'Exam Proctoring'
                : activeSection === 'results'
                ? 'Result Analysis'
                : activeSection === 'classes'
                ? 'Online Classes'
                : activeSection === 'profile'
                ? 'Profile'
                : 'Settings'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Welcome back, {teacher?.firstName || teacher?.name || 'Teacher'}.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell userType="teacher" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">{content}</div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;


