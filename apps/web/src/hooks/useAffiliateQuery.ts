import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/referral';

export const useAffiliateQuery = () => {
  return useQuery({
    queryKey: ['affiliate-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.data;
    }
  });
};
