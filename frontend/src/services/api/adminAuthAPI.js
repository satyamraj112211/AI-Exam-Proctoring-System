const ADMIN_EMAIL = 'kunalsharmakunu09@gmail.com';
const ADMIN_PASSWORD = 'pappuCAN09@';
const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_PROFILE_KEY = 'adminProfile';

const fakeNetworkDelay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export const adminAuthAPI = {
  login: async (email, password) => {
    await fakeNetworkDelay();

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = 'admin-session-token';
      const admin = {
        name: 'Admin',
        email: ADMIN_EMAIL,
      };

      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(admin));

      return {
        success: true,
        data: {
          token,
          admin,
        },
        message: 'Login successful',
      };
    }

    const error = new Error('Invalid admin credentials');
    error.response = { data: { message: 'Invalid admin credentials' } };
    throw error;
  },

  logout: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_PROFILE_KEY);
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  getCurrentAdmin: () => {
    const adminData = localStorage.getItem(ADMIN_PROFILE_KEY);
    return adminData ? JSON.parse(adminData) : null;
  },

  getToken: () => {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },
};

export default adminAuthAPI;























