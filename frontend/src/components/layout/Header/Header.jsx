import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaBell, FaCog, FaUserGraduate, FaChalkboardTeacher, FaUserShield } from 'react-icons/fa';

const Header = () => {
  const [showLoginMenu, setShowLoginMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close login menu on outside click for better UX
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLoginMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginNavigate = (path) => {
    setShowLoginMenu(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              VirtualXAM
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
              Dashboard
            </Link>
            <Link to="/exams" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
              Exams
            </Link>
            <Link to="/reports" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
              Reports
            </Link>
            <Link to="/settings" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
              Settings
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4 relative" ref={menuRef}>
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <FaBell className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <FaCog className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLoginMenu((prev) => !prev)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              aria-haspopup="true"
              aria-expanded={showLoginMenu}
            >
              <FaUser className="w-4 h-4" />
              <span>Login</span>
            </button>

            {showLoginMenu && (
              <div className="fixed right-4 md:right-8 top-16 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 z-50">
                <button
                  onClick={() => handleLoginNavigate('/auth/student-login')}
                  className="w-full px-4 py-3 flex items-center space-x-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <FaUserGraduate className="text-blue-600" />
                  <span>Login as Student</span>
                </button>
                <button
                  onClick={() => handleLoginNavigate('/auth/teacher-login')}
                  className="w-full px-4 py-3 flex items-center space-x-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <FaChalkboardTeacher className="text-purple-600" />
                  <span>Login as Teacher</span>
                </button>
                <button
                  onClick={() => handleLoginNavigate('/auth/admin-login')}
                  className="w-full px-4 py-3 flex items-center space-x-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <FaUserShield className="text-emerald-600" />
                  <span>Login as Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;