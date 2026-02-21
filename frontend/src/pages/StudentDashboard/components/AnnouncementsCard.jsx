import React from 'react';
import { motion } from 'framer-motion';
import { FaBullhorn, FaChevronRight } from 'react-icons/fa';

const AnnouncementsCard = ({ announcements }) => {
  if (!announcements || announcements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <FaBullhorn className="mr-2 text-sky-600" />
          Announcements
        </h3>
        <div className="text-center py-8">
          <p className="text-slate-500">No announcements</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <FaBullhorn className="mr-2 text-sky-600" />
        Announcements
      </h3>

      <div className="space-y-3">
        {announcements.slice(0, 3).map((announcement, index) => (
          <div
            key={announcement.id || index}
            className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
          >
            <p className="text-sm font-medium text-slate-900">
              {announcement.title}
            </p>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {announcement.content}
            </p>
          </div>
        ))}
      </div>

      {announcements.length > 3 && (
        <button className="mt-4 w-full text-sm text-sky-600 hover:text-sky-700 flex items-center justify-center space-x-1">
          <span>View Details</span>
          <FaChevronRight className="w-3 h-3" />
        </button>
      )}
    </motion.div>
  );
};

export default AnnouncementsCard;









