import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaChalkboardTeacher, FaSearch, FaDownload, FaTrash } from 'react-icons/fa';
import adminAuthAPI from '../services/api/adminAuthAPI';
import adminUsersAPI from '../services/api/adminUsersAPI';
import AdminDashboard from './AdminDashboard';

const AdminTeachers = () => {
  const navigate = useNavigate();
  const [university, setUniversity] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const {
    data: teachersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['adminTeachers', university],
    queryFn: async () => {
      if (!university.trim()) return { teachers: [], count: 0 };
      return adminUsersAPI.getTeachersByUniversity(university.trim());
    },
    enabled: false,
  });

  const teachers = useMemo(() => teachersData?.teachers || [], [teachersData]);

  const handleSearch = () => {
    if (!adminAuthAPI.isAuthenticated()) {
      navigate('/auth/admin-login', { replace: true });
      return;
    }
    refetch();
  };

  const toCSV = () => {
    if (!teachers.length) return '';
    const headers = ['Teacher ID', 'First Name', 'Last Name', 'Email', 'University', 'Department'];
    const rows = teachers.map((t) => [
      t.teacherId || '',
      t.firstName || '',
      t.lastName || '',
      t.email || '',
      t.university || '',
      t.department || '',
    ]);
    return [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  };

  const download = (ext) => {
    const csv = toCSV();
    if (!csv) {
      alert('No data to download');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `teachers.${ext}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (!window.confirm(`Are you sure you want to delete ${teacherName}? This will permanently remove the teacher, all their tests, and all attempts for those tests from the database. This action cannot be undone.`)) {
      return;
    }

    setDeletingId(teacherId);
    setError('');

    try {
      await adminUsersAPI.deleteTeacher(teacherId);
      // Refetch teachers to update the list
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete teacher');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminDashboard
        activeKey="teachers"
        overrideContent={
          <main className="p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                    <FaChalkboardTeacher />
                    Teachers
                  </h1>
                  <p className="text-sm text-slate-600">
                    Search teachers by university and export the list.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                <div className="relative md:w-1/2">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter university name..."
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => download('csv')}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm inline-flex items-center gap-2"
                  >
                    <FaDownload className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => download('xlsx')}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm inline-flex items-center gap-2"
                  >
                    <FaDownload className="w-4 h-4" />
                    Excel
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Teacher ID', 'Name', 'Email', 'University', 'Department', 'Action'].map((head) => (
                        <th
                          key={head}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!teachers || teachers.length === 0) && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-sm text-slate-500 text-center">
                          {university.trim() ? 'No teachers found for this university' : 'Enter a university to search'}
                        </td>
                      </tr>
                    )}
                    {teachers.map((t) => {
                      const teacherId = t._id || t.id;
                      const teacherName = `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.teacherId;
                      const isDeleting = deletingId === teacherId;
                      
                      return (
                        <tr key={t.teacherId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">{t.teacherId}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            <div className="flex items-center justify-between">
                              <span>{teacherName}</span>
                              <button
                                onClick={() => handleDeleteTeacher(teacherId, teacherName)}
                                disabled={isDeleting || isLoading}
                                className="ml-2 p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove teacher"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{t.email}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{t.university}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{t.department || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {isDeleting && <span className="text-xs text-slate-400">Deleting...</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        }
      />
    </div>
  );
};

export default AdminTeachers;

