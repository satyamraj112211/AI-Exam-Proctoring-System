import axiosClient from '../axiosClient';

export const systemConfigAPI = {
  /**
   * Get system configuration
   * @returns {Promise<Object>}
   */
  getSystemConfig: async () => {
    const res = await axiosClient.get('/v1/admin/system-config');
    const payload = res?.data ?? res;
    const apiData = payload?.data ?? payload;
    return apiData?.config ?? apiData;
  },

  /**
   * Update system configuration
   * @param {Object} configData - Configuration data to update
   * @returns {Promise<Object>}
   */
  updateSystemConfig: async (configData) => {
    const res = await axiosClient.put('/v1/admin/system-config', configData);
    const payload = res?.data ?? res;
    const apiData = payload?.data ?? payload;
    return apiData?.config ?? apiData;
  },

  /**
   * Reset system configuration to defaults
   * @returns {Promise<Object>}
   */
  resetSystemConfig: async () => {
    const res = await axiosClient.post('/v1/admin/system-config/reset');
    const payload = res?.data ?? res;
    const apiData = payload?.data ?? payload;
    return apiData?.config ?? apiData;
  },
};

export default systemConfigAPI;








