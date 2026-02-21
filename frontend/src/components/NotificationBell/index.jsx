import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { announcementAPI } from '../../services/api/announcementAPI';
import { formatRelativeTime } from '../../utils/timeFormatter';

const NotificationBell = ({ userType = 'student' }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const fetchingRef = useRef(false);

  // Fetch announcements with error handling for rate limiting
  const fetchAnnouncements = async () => {
    // Don't fetch if already loading to prevent concurrent requests
    if (fetchingRef.current || loading) return;
    
    fetchingRef.current = true;
    setLoading(true);
    try {
      const data = userType === 'student'
        ? await announcementAPI.getStudentAnnouncements()
        : await announcementAPI.getTeacherAnnouncements();
      
      setAnnouncements(data.announcements || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // If rate limited, don't show error, just use cached data
      if (error.response?.status === 429) {
        console.warn('Rate limited on announcements, using cached data');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Initial fetch and periodic refresh - reduced frequency to prevent rate limiting
  useEffect(() => {
    let isMounted = true;
    
    const fetchWithCheck = async () => {
      if (isMounted) {
        await fetchAnnouncements();
      }
    };
    
    fetchWithCheck();
    
    // Refresh every 2 minutes instead of 30 seconds to prevent rate limiting
    const interval = setInterval(fetchWithCheck, 120000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark announcement as read
  const handleMarkAsRead = async (announcementId, isRead) => {
    if (isRead) return; // Already read

    try {
      if (userType === 'student') {
        await announcementAPI.markStudentAnnouncementRead(announcementId);
      } else {
        await announcementAPI.markTeacherAnnouncementRead(announcementId);
      }

      // Update local state
      setAnnouncements(prev =>
        prev.map(ann =>
          ann.id === announcementId ? { ...ann, isRead: true } : ann
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  // Handle announcement click
  const handleAnnouncementClick = (announcement) => {
    handleMarkAsRead(announcement.id, announcement.isRead);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    // Only refresh when opening and not recently fetched (debounce)
    if (!isOpen && !loading) {
      const lastFetch = sessionStorage.getItem(`notificationLastFetch_${userType}`);
      const now = Date.now();
      // Only fetch if last fetch was more than 10 seconds ago
      if (!lastFetch || (now - parseInt(lastFetch)) > 10000) {
        fetchAnnouncements();
        sessionStorage.setItem(`notificationLastFetch_${userType}`, now.toString());
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-slate-600">
                  {unreadCount} {unreadCount === 1 ? 'unread' : 'unread'}
                </span>
              )}
            </div>
          </div>

          {/* Announcements List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Loading...
              </div>
            ) : announcements.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No announcements
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    onClick={() => handleAnnouncementClick(announcement)}
                    className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                      !announcement.isRead ? 'bg-sky-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Unread indicator */}
                      {!announcement.isRead && (
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-sm font-medium ${
                            !announcement.isRead
                              ? 'text-slate-900'
                              : 'text-slate-700'
                          }`}
                        >
                          {announcement.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {announcement.content}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatRelativeTime(announcement.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {announcements.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  // Mark all as read
                  announcements.forEach(ann => {
                    if (!ann.isRead) {
                      handleMarkAsRead(ann.id, false);
                    }
                  });
                }}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;


