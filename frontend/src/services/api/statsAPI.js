import axios from "../axiosClient";

export const statsAPI = {
  getHomeStats: async () => {
    try {
      const response = await axios.get('/v1/stats/home');
      return response;
    } catch (error) {
      console.error('Error fetching home stats:', error);
      // Return mock data for development
      return {
        platformStats: [
          { label: 'Active Exams', value: '24' },
          { label: 'Students Online', value: '1,248' },
          { label: 'Total Institutions', value: '156' },
          { label: 'Success Rate', value: '98.7%' },
        ]
      };
    }
  }
};