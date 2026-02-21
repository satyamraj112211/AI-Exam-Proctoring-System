import axiosClient from '../axiosClient';

export const announcementAPI = {
  /**
   * Create a new announcement
   * @param {Object} announcementData - Announcement data
   * @param {string} announcementData.title - Announcement title
   * @param {string} announcementData.description - Announcement description/content
   * @param {string} announcementData.targetAudience - 'all', 'students', or 'teachers'
   * @param {string} announcementData.targetType - 'all' or 'specific'
   * @param {Array} announcementData.studentFilters - Array of student filter objects (for specific students)
   * @param {Array} announcementData.teacherIds - Array of teacher IDs (for specific teachers)
   * @returns {Promise<Object>}
   */
  createAnnouncement: async (announcementData) => {
    const res = await axiosClient.post('/v1/admin/announcements', announcementData);
    const payload = res?.data ?? res;
    const apiData = payload?.data ?? payload;
    
    // Extract announcement data with counts
    if (apiData?.announcement) {
      return apiData.announcement;
    }
    
    return apiData;
  },

  /**
   * Get all announcements (admin)
   * @returns {Promise<Array>}
   */
  getAnnouncements: async () => {
    const res = await axiosClient.get('/v1/admin/announcements');
    const payload = res?.data ?? res;
    const apiData = payload?.data ?? payload;
    return Array.isArray(apiData?.announcements) ? apiData.announcements : [];
  },

  /**
   * Get announcements for student
   * @returns {Promise<{announcements: Array, unreadCount: number}>}
   */
  getStudentAnnouncements: async () => {
    const res = await axiosClient.get('/v1/student/announcements');
    const payload = res?.data ?? res;
    const apiData = payload?.data ?? payload;
    return {
      announcements: Array.isArray(apiData?.announcements) ? apiData.announcements : [],
      unreadCount: apiData?.unreadCount || 0
    };
  },

  /**
   * Get announcements for teacher
   * @returns {Promise<{announcements: Array, unreadCount: number}>}
   */
  getTeacherAnnouncements: async () => {
    const res = await axiosClient.get('/v1/teacher/announcements');
    const payload = res?.data ?? res;
    const apiData = payload?.data ?? payload;
    return {
      announcements: Array.isArray(apiData?.announcements) ? apiData.announcements : [],
      unreadCount: apiData?.unreadCount || 0
    };
  },

  /**
   * Mark announcement as read by student
   * @param {string} announcementId
   * @returns {Promise<void>}
   */
  markStudentAnnouncementRead: async (announcementId) => {
    await axiosClient.post(`/v1/student/announcements/${announcementId}/read`);
  },

  /**
   * Mark announcement as read by teacher
   * @param {string} announcementId
   * @returns {Promise<void>}
   */
  markTeacherAnnouncementRead: async (announcementId) => {
    await axiosClient.post(`/v1/teacher/announcements/${announcementId}/read`);
  },
};

export default announcementAPI;

