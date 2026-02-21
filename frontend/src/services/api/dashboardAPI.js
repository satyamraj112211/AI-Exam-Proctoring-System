import axios from '../axiosClient';

export const dashboardAPI = {
  // Get dashboard data
  getDashboard: async () => {
    try {
      const response = await axios.get('/v1/student/dashboard');
      
      // axiosClient interceptor already returns response.data
      // Backend returns ApiResponse structure: { status, data, message }
      // So response is already the ApiResponse object
      const apiResponse = response;
      
      // Extract the actual data from ApiResponse
      const dashboardData = apiResponse?.data ?? apiResponse;
      
      console.log('Dashboard API Response:', {
        apiResponse,
        dashboardData,
        availableExams: dashboardData?.availableExams,
        availableExamsCount: dashboardData?.availableExams?.length
      });
      
      return dashboardData;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error response:', error.response?.data || error.message);
      
      // If 401, redirect to login
      if (error.response?.status === 401 || error.message?.includes('401')) {
        localStorage.removeItem('token');
        localStorage.removeItem('student');
        window.location.href = '/auth/student-login';
      }
      
      throw error;
    }
  }
};

export default dashboardAPI;









