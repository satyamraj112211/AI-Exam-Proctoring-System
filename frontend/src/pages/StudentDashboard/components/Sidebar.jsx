import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaBook,
  FaClipboardList,
  FaTrophy,
  FaUser,
  FaCog
} from 'react-icons/fa';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: FaHome, label: 'Dashboard', path: '/student/dashboard' },
    { icon: FaBook, label: 'Courses', path: '/student/courses' },
    { icon: FaClipboardList, label: 'Available Exams', path: '/student/available-exams' },
    { icon: FaTrophy, label: 'My Results', path: '/student/results' },
    { icon: FaUser, label: 'Profile', path: '/student/profile' },
    { icon: FaCog, label: 'Settings', path: '/student/settings' }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">VirtualXam</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded-lg transition-colors ${
                active
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;









