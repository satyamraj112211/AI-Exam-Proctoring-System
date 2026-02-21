import axios from '../axiosClient';

export const teacherAuthAPI = {
  // Send OTP
  sendOTP: async (email) => {
    const response = await axios.post('/v1/auth/teacher/send-otp', { email });
    return response;
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await axios.post('/v1/auth/teacher/verify-otp', { email, otp });
    return response;
  },

  // Complete registration
  register: async (data) => {
    const response = await axios.post('/v1/auth/teacher/register', data);

    if (response.data?.token) {
      localStorage.setItem('teacherToken', response.data.token);
      localStorage.setItem('teacherData', JSON.stringify(response.data.teacher));
    }

    return response;
  },

  // Login
  login: async (email, password) => {
    const response = await axios.post('/v1/auth/teacher/login', { email, password });
    
    // Store token
    if (response.data?.token) {
      localStorage.setItem('teacherToken', response.data.token);
      localStorage.setItem('teacherData', JSON.stringify(response.data.teacher));
    }
    
    return response;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherData');
  },

  // Get current teacher
  getCurrentTeacher: () => {
    const teacherData = localStorage.getItem('teacherData');
    return teacherData ? JSON.parse(teacherData) : null;
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('teacherToken');
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('teacherToken');
  }
};

export const studentAuthAPI = {
  // Login
  login: async (email, password) => {
    const response = await axios.post('/v1/auth/login', { email, password });
    
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('student', JSON.stringify(response.data.student));
    }
    
    return response;
  },

  // Forgot password - Send OTP
  forgotPassword: async (email) => {
    const response = await axios.post('/v1/auth/forgot-password', { email });
    return response;
  },

  // Verify reset OTP
  verifyResetOTP: async (email, otp) => {
    const response = await axios.post('/v1/auth/verify-reset-otp', { email, otp });
    return response;
  },

  // Reset password
  resetPassword: async (resetToken, password, confirmPassword) => {
    const response = await axios.post('/v1/auth/reset-password', {
      resetToken,
      password,
      confirmPassword
    });
    return response;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('student');
  },

  // Get current student
  getCurrentStudent: () => {
    const studentData = localStorage.getItem('student');
    return studentData ? JSON.parse(studentData) : null;
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('token');
  }
};

// Add forgot password methods to teacherAuthAPI
teacherAuthAPI.forgotPassword = async (email) => {
  const response = await axios.post('/v1/auth/teacher/forgot-password', { email });
  return response;
};

teacherAuthAPI.verifyResetOTP = async (email, otp) => {
  const response = await axios.post('/v1/auth/teacher/verify-reset-otp', { email, otp });
  return response;
};

teacherAuthAPI.resetPassword = async (resetToken, password, passwordConfirm) => {
  const response = await axios.post('/v1/auth/teacher/reset-password', {
    resetToken,
    password,
    passwordConfirm
  });
  return response;
};

export default teacherAuthAPI;