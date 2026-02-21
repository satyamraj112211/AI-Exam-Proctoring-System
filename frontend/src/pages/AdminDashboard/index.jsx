import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBookOpen,
  FaUsers,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaChartPie,
  FaClock,
  FaSearch,
  FaBars,
  FaCalendarAlt,
} from 'react-icons/fa';
import { adminAuthAPI } from '../../services/api/adminAuthAPI';
import { testAPI } from '../../services/api/testAPI';

const usageMetrics = [
  { label: 'Total Users', value: '—', percent: '—', accent: 'bg-sky-500' },
  { label: 'Total Completed', value: '—', percent: '—', accent: 'bg-green-500' },
  { label: 'Average Score', value: '—', percent: '—', accent: 'bg-purple-500' },
  { label: 'Time Spent', value: '—', percent: '—', accent: 'bg-amber-500' },
];

const SidebarLink = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
      active
        ? 'bg-white text-slate-900 shadow-sm'
        : 'text-slate-200 hover:bg-white/10 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, percent, accent }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
    <div className="flex items-center space-x-2">
      <span className={`w-2 h-10 rounded-full ${accent}`} />
      {percent !== '—' && <span className="text-xs text-slate-500">{percent}</span>}
    </div>
  </div>
);

const AdminDashboard = ({ overrideContent, activeKey = 'dashboard' }) => {
  const navigate = useNavigate();
  const admin = adminAuthAPI.getCurrentAdmin();
  const [scheduledExams, setScheduledExams] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (!adminAuthAPI.isAuthenticated()) {
      navigate('/auth/admin-login', { replace: true });
    }

    let mounted = true;
    (async () => {
      try {
        const tests = await testAPI.list();
        if (mounted) {
          setScheduledExams(tests);
          setRecentActivities(
            tests.slice(-5).map((test) => ({
              exam: test.name,
              score: '—',
              name: `${test.type.toUpperCase()} • ${test.questions?.length || 0} items`,
              time: new Date(test.schedule?.start || Date.now()).toLocaleString(),
            })),
          );
        }
      } catch (error) {
        console.error('Failed to load scheduled exams', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    adminAuthAPI.logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-6 hidden md:flex flex-col space-y-6">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-lg bg-sky-500 flex items-center justify-center text-white text-2xl font-bold">
            <FaBookOpen />
          </div>
          <div>
            <p className="text-sm text-slate-300">Welcome,</p>
            <p className="text-lg font-semibold">{admin?.name || 'Admin'}</p>
          </div>
        </div>

        <nav className="space-y-2">
          <SidebarLink icon={FaChartPie} label="Dashboard" active={activeKey === 'dashboard'} onClick={() => navigate('/admin/dashboard')} />
          <SidebarLink
            icon={FaCalendarAlt}
            label="Schedule Exams"
            active={activeKey === 'schedule'}
            onClick={() => navigate('/admin/scheduled-exams')}
          />
          <SidebarLink icon={FaUserGraduate} label="Students" active={activeKey === 'students'} onClick={() => navigate('/admin/students')} />
          <SidebarLink icon={FaChalkboardTeacher} label="Teachers" active={activeKey === 'teachers'} onClick={() => navigate('/admin/teachers')} />
          <SidebarLink icon={FaUsers} label="Profile" active={activeKey === 'profile'} onClick={() => navigate('/admin/profile')} />
          <SidebarLink icon={FaCog} label="System Configuration" active={activeKey === 'config'} onClick={() => navigate('/admin/system-config')} />
          <SidebarLink icon={FaBell} label="Announcements" active={activeKey === 'announcements'} onClick={() => navigate('/admin/announcements')} />
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-sm text-slate-200 hover:text-white"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="md:hidden p-2 rounded-md bg-slate-100 text-slate-600">
              <FaBars />
            </button>
            <div>
              <p className="text-sm text-slate-500">Welcome, {admin?.name || 'Admin'}!</p>
              <h1 className="text-xl font-semibold text-slate-900">Admin Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search"
                className="pl-9 pr-3 py-2 rounded-md bg-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
            <button className="p-2 rounded-full bg-slate-100 text-slate-600">
              <FaBell />
            </button>
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-semibold">
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{admin?.name || 'Admin'}</p>
                <p className="text-xs text-slate-500">{admin?.email || 'admin@example.com'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 space-y-6">
          {overrideContent ? (
            overrideContent
          ) : (
            <>
          {/* Scheduled Exams */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Scheduled Exams</h2>
              <button
                onClick={() => navigate('/admin/scheduled-exams')}
                className="text-sky-600 text-sm font-medium hover:underline"
              >
                Manage schedules
              </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Exam Name', 'Date & Time', 'Limit', 'Duration', 'Status'].map((head) => (
                        <th key={head} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {scheduledExams.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-sm text-slate-500 text-center">
                        No scheduled exams yet. Click &quot;Manage schedules&quot; to create one.
                      </td>
                    </tr>
                  )}
                  {scheduledExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{exam.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {exam.schedule?.start ? new Date(exam.schedule.start).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {(exam.allocations?.users?.length || 0) + (exam.allocations?.teachers?.length || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{exam.schedule?.duration || '—'} min</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                          Scheduled
                        </span>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Usage Overview */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {usageMetrics.map((metric) => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </section>

          {/* Recent Activity */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <p className="text-xs uppercase text-slate-500 tracking-wide">Recent User Activity</p>
                  <h3 className="text-lg font-semibold text-slate-900">Latest Exams</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-xs bg-slate-100 rounded-md text-slate-600">Latest</button>
                  <button className="px-3 py-1 text-xs text-slate-500">Analytics</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Exam', 'Score', 'Candidate', 'Time'].map((head) => (
                        <th key={head} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentActivities.map((item) => (
                      <tr key={item.exam} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.exam}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{item.score}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{item.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-500 tracking-wide">Performance</p>
                  <h3 className="text-lg font-semibold text-slate-900">Engagement Overview</h3>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <FaClock />
                  <span className="text-xs">Updated 1h ago</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Goal Reached</span>
                  <span className="text-sm font-semibold text-emerald-600">85%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-emerald-500" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Earned Points</span>
                  <span className="text-sm font-semibold text-blue-600">89%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[89%] bg-blue-500" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Average Score</span>
                  <span className="text-sm font-semibold text-purple-600">77%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[77%] bg-purple-500" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Time Spent</span>
                  <span className="text-sm font-semibold text-amber-600">45h</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[60%] bg-amber-500" />
                </div>
              </div>
            </div>
          </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

