import axiosClient from '../axiosClient';

export const adminUsersAPI = {
  /**
   * Fetch students for a specific institution / branch / year / section path.
   * The backend wraps the result in an ApiResponse, so here we unwrap it into
   * a predictable shape: { students: [], count: number }.
   */
  listStudents: async ({ institutionId, branchCode, batchYear, currentYear, section }) => {
    const params = {
      institutionId,
      branchCode,
      batchYear,
      currentYear,
      section,
    };

    const res = await axiosClient.get('/v1/admin/students', { params });
    const payload = res?.data ?? res;
    const apiData = payload?.data ?? payload;

    const students = Array.isArray(apiData?.students) ? apiData.students : [];
    const count =
      typeof apiData?.count === 'number'
        ? apiData.count
        : Array.isArray(students)
        ? students.length
        : 0;

    return { students, count };
  },

  /**
   * Fetch teachers by their teacher IDs
   * @param {string[]} teacherIds - Array of teacher ID strings
   * @returns {Promise<{teachers: [], count: number}>}
   */
  getTeachersByIds: async (teacherIds) => {
    if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
      return { teachers: [], count: 0 };
    }

    const params = {
      teacherIds: teacherIds.join(','),
    };

    const res = await axiosClient.get('/v1/admin/teachers/by-ids', { params });
    const payload = res?.data ?? res;
    const apiData = payload?.data ?? payload;

    const teachers = Array.isArray(apiData?.teachers) ? apiData.teachers : [];
    const count =
      typeof apiData?.count === 'number'
        ? apiData.count
        : Array.isArray(teachers)
        ? teachers.length
        : 0;

    return { teachers, count };
  },

  /**
   * Fetch teachers by university (partial, case-insensitive)
   * @param {string} university
   * @returns {Promise<{teachers: [], count: number}>}
   */
  getTeachersByUniversity: async (university) => {
    if (!university || !university.trim()) {
      return { teachers: [], count: 0 };
    }

    // Use exact university name (trimmed)
    const params = { university: university.trim() };

    const res = await axiosClient.get('/v1/admin/teachers/by-university', { params });
    const payload = res?.data ?? res;
    const apiData = payload?.data ?? payload;

    const teachers = Array.isArray(apiData?.teachers) ? apiData.teachers : [];
    const count =
      typeof apiData?.count === 'number'
        ? apiData.count
        : Array.isArray(teachers)
        ? teachers.length
        : 0;

    return { data: { teachers, count }, teachers, count };
  },

  /**
   * Get all unique universities for autocomplete
   * @param {string} search - Optional search term
   * @returns {Promise<{universities: string[]}>}
   */
  getUniversities: async (search = '') => {
    const params = search ? { search } : {};
    const res = await axiosClient.get('/v1/admin/universities', { params });
    const payload = res?.data ?? res;
    const apiData = payload?.data ?? payload;
    return {
      universities: Array.isArray(apiData?.universities) ? apiData.universities : []
    };
  },

  /**
   * Delete a student by ID
   * @param {string} studentId - Student ID to delete
   * @returns {Promise<{success: boolean, message: string}>}
   */
  deleteStudent: async (studentId) => {
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    const res = await axiosClient.delete(`/v1/admin/students/${studentId}`);
    const payload = res?.data ?? res;
    
    return {
      success: true,
      message: payload?.message || 'Student deleted successfully'
    };
  },

  /**
   * Delete a teacher by ID
   * @param {string} teacherId - Teacher ID to delete
   * @returns {Promise<{success: boolean, message: string}>}
   */
  deleteTeacher: async (teacherId) => {
    if (!teacherId) {
      throw new Error('Teacher ID is required');
    }

    const res = await axiosClient.delete(`/v1/admin/teachers/${teacherId}`);
    const payload = res?.data ?? res;
    
    return {
      success: true,
      message: payload?.message || 'Teacher deleted successfully'
    };
  },
};

export default adminUsersAPI;




