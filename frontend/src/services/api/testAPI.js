import axiosClient from '../axiosClient';

/**
 * Test API - Backend integration
 * Handles test creation, listing, and retrieval from the backend
 */
export const testAPI = {
  /**
   * List all tests (for admin scheduled exams page)
   * @returns {Promise<Array>} Array of test objects
   */
  list: async () => {
    try {
      const response = await axiosClient.get('/v1/tests');
      const payload = response?.data ?? response;
      const apiData = payload?.data ?? payload;
      
      // Handle both direct array and wrapped response
      if (Array.isArray(apiData?.tests)) {
        return apiData.tests;
      }
      if (Array.isArray(apiData)) {
        return apiData;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      // Fallback to empty array on error
      return [];
    }
  },

  /**
   * Create a new test with questions and student allocation
   * @param {Object} payload - Test data including name, type, questions, schedule, allocations
   * @returns {Promise<Object>} Created test object
   */
  create: async (payload) => {
    try {
      const response = await axiosClient.post('/v1/tests', payload);
      const apiResponse = response?.data ?? response;
      const testData = apiResponse?.data ?? apiResponse;
      
      // Return the test object in a format compatible with existing code
      return {
        id: testData?.test?._id || testData?.test?.id || testData?.id,
        ...testData?.test,
        ...testData,
      };
    } catch (error) {
      console.error('Failed to create test:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create test';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get test by ID (for student exam page)
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Test object with questions
   */
  getById: async (testId) => {
    try {
      const response = await axiosClient.get(`/v1/tests/${testId}`);
      const apiResponse = response?.data ?? response;
      const testData = apiResponse?.data ?? apiResponse;
      
      return testData;
    } catch (error) {
      console.error('Failed to fetch test:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch test';
      throw new Error(errorMessage);
    }
  },

  /**
   * Clear all tests (admin utility - not implemented in backend yet)
   * @returns {Promise<void>}
   */
  clear: async () => {
    console.warn('clear() is not implemented in backend API');
    return Promise.resolve();
  },

  /**
   * Submit test attempt
   * @param {string} testId - Test ID
   * @param {Object} attemptData - Attempt data including answers, timeSpent, isAutoSubmitted
   * @returns {Promise<Object>} Submission result
   */
  submitAttempt: async (testId, attemptData) => {
    try {
      const response = await axiosClient.post(`/v1/tests/${testId}/attempts`, attemptData);
      const apiResponse = response?.data ?? response;
      const resultData = apiResponse?.data ?? apiResponse;
      return resultData;
    } catch (error) {
      console.error('Failed to submit attempt:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit test';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get attempt result
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Result data
   */
  getResult: async (testId) => {
    try {
      const response = await axiosClient.get(`/v1/tests/${testId}/attempts/result`);
      const apiResponse = response?.data ?? response;
      const resultData = apiResponse?.data ?? apiResponse;
      return resultData;
    } catch (error) {
      console.error('Failed to fetch result:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch result';
      throw new Error(errorMessage);
    }
  },

  /**
   * Check if student has attempted a test
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Check result
   */
  checkAttempt: async (testId) => {
    try {
      const response = await axiosClient.get(`/v1/tests/${testId}/attempts/check`);
      const apiResponse = response?.data ?? response;
      const resultData = apiResponse?.data ?? apiResponse;
      return resultData;
    } catch (error) {
      console.error('Failed to check attempt:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check attempt';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get all attempts for the logged-in student
   * @returns {Promise<Array>} Attempts list
   */
  getMyAttempts: async () => {
    try {
      const response = await axiosClient.get('/v1/tests/attempts/my');
      const apiResponse = response?.data ?? response;
      const resultData = apiResponse?.data ?? apiResponse;
      return resultData;
    } catch (error) {
      console.error('Failed to fetch attempts:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch attempts';
      throw new Error(errorMessage);
    }
  },
};

export default testAPI;
