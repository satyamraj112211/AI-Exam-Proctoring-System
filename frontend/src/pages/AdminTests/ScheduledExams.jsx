import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaCode, FaListUl, FaRandom } from 'react-icons/fa';
import { adminAuthAPI } from '../../services/api/adminAuthAPI';
import { testAPI } from '../../services/api/testAPI';

const TestTypeCard = ({ title, description, icon: Icon, onSelect }) => (
  <button
    onClick={onSelect}
    className="w-full h-full text-left bg-white border border-slate-200 hover:border-sky-400 rounded-2xl p-5 shadow-sm transition-all flex space-x-4"
  >
    <div className="h-12 w-12 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
      <Icon />
    </div>
    <div className="flex-1">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
    </div>
  </button>
);

const ScheduledExams = () => {
  const navigate = useNavigate();
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminAuthAPI.isAuthenticated()) {
      navigate('/auth/admin-login', { replace: true });
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const data = await testAPI.list();
        if (mounted) setScheduled(data);
      } catch (error) {
        console.error('Failed to load scheduled exams', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const goToCreate = (type) => {
    navigate(`/admin/tests/new?type=${type}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Admin • Scheduling</p>
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center space-x-2">
              <FaCalendarAlt className="text-sky-500" />
              <span>Scheduled Exams</span>
            </h1>
          </div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-sm text-sky-600 hover:text-sky-700"
          >
            Back to Dashboard
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TestTypeCard
            title="Create MCQ Test"
            description="Upload or author multiple-choice questions with rich validation."
            icon={FaListUl}
            onSelect={() => goToCreate('mcq')}
          />
          <TestTypeCard
            title="Create Coding Test"
            description="Define coding prompts, starter code, and evaluation hints."
            icon={FaCode}
            onSelect={() => goToCreate('coding')}
          />
          <TestTypeCard
            title="Create Hybrid Test"
            description="Combine MCQs and coding items into a single assessment."
            icon={FaRandom}
            onSelect={() => goToCreate('hybrid')}
          />
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate-500 tracking-wide">Upcoming</p>
              <h2 className="text-lg font-semibold text-slate-900">Existing Schedules</h2>
            </div>
            <span className="text-sm text-slate-500">
              {loading ? 'Loading...' : `${scheduled.length} total`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['Name', 'Type', 'Start', 'Window Close', 'Duration', 'Allocated To'].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && scheduled.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-sm text-slate-500 text-center">
                      No schedules yet. Create one to get started.
                    </td>
                  </tr>
                )}
                {scheduled.map((item) => {
                  // Handle both old localStorage format and new backend format
                  const testName = item.name || item.title;
                  const testType = item.type || item.course || 'MCQ';
                  const startDate = item.schedule?.start || item.scheduledDate;
                  const windowClose = item.schedule?.windowClose || item.windowCloseDate || null;
                  const duration = item.schedule?.duration || item.duration;
                  
                  // Allocation count: backend returns allocatedTo, or calculate from studentCount
                  const allocatedCount = item.allocatedTo || 
                    (item.studentCount ? item.studentCount + (item.teacher ? 1 : 0) : 0) ||
                    (item.allocations?.stats?.studentCount ?? 0) + (item.allocations?.teacherIds?.length || 0);

                  return (
                    <tr key={item.id || item._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{testName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{testType.toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {startDate ? new Date(startDate).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {windowClose ? new Date(windowClose).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{duration ? `${duration} min` : 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {allocatedCount} {allocatedCount === 1 ? 'recipient' : 'recipients'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ScheduledExams;




