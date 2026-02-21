import React, { useState } from 'react';
import { FaSearch, FaUserCircle } from 'react-icons/fa';
import NotificationBell from '../../../components/NotificationBell';

const Header = ({ studentName, avatarUrl }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const initials =
    studentName && studentName.trim().length
      ? studentName
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : '';

  const [imageError, setImageError] = useState(false);

  const showImage = avatarUrl && !imageError;

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exams, courses..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
            />
          </div>
        </div>

        {/* Notifications and Avatar */}
        <div className="ml-4 flex items-center gap-4">
          {/* Avatar just left of bell icon */}
          {showImage ? (
            <img
              src={avatarUrl}
              alt="Profile avatar"
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
              onError={() => setImageError(true)}
            />
          ) : initials ? (
            <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-xs font-semibold text-sky-700 border border-sky-200">
              {initials}
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <FaUserCircle className="w-6 h-6" />
            </div>
          )}

          <NotificationBell userType="student" />
        </div>
      </div>
    </header>
  );
};

export default Header;









