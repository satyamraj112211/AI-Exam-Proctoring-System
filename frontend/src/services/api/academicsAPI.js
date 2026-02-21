import axiosClient from '../axiosClient';

export const academicsAPI = {
  getInstitutions: async (type) => {
    const params = type ? { type } : {};
    const res = await axiosClient.get('/v1/academics/institutions', { params });
    return res.data ?? res;
  },
  getStructure: async (institutionId) => {
    const res = await axiosClient.get(`/v1/academics/institutions/${institutionId}/structure`);
    return res.data ?? res;
  },
};

export default academicsAPI;





















