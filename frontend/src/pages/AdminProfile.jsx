import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import AdminDashboard from './AdminDashboard';
import adminAuthAPI from '../services/api/adminAuthAPI';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const admin = adminAuthAPI.getCurrentAdmin();
    if (!admin) {
      navigate('/auth/admin-login', { replace: true });
      return;
    }
    setFormState({
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
    });
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const admin = adminAuthAPI.getCurrentAdmin() || {};
    const updated = { ...admin, ...formState };
    localStorage.setItem('adminProfile', JSON.stringify(updated));
    alert('Profile updated');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Reuse AdminDashboard header/layout */}
      <AdminDashboard
        activeKey="profile"
        overrideContent={
          <main className="p-6 flex justify-center">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h1 className="text-2xl font-semibold text-slate-900 mb-1">Admin Profile</h1>
              <p className="text-sm text-slate-600 mb-6">
                View and update your admin profile information.
              </p>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                  <FaUserCircle className="w-12 h-12" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{formState.name || 'Admin'}</p>
                  <p className="text-sm text-slate-500">{formState.email || 'admin@example.com'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formState.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </main>
        }
      />
    </div>
  );
};

export default AdminProfile;

