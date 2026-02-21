import axiosClient from '../axiosClient';

export const studentProfileAPI = {
  getProfile: async () => {
    return axiosClient.get('/students/profile');
  },

  updateProfile: async (formData) => {
    const response = await axiosClient.put('/students/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Sync latest student profile to localStorage for quick access (e.g., header avatar)
    const updated = response?.data;
    if (updated) {
      try {
        localStorage.setItem('student', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist updated student profile', e);
      }
    }

    return response;
  }
};


