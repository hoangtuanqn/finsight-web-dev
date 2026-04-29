import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/referral';

export const useAffiliateQuery = () => {
  return useQuery({
    queryKey: ['affiliate-stats-v2'],
    queryFn: async () => {
      // SỬA LỖI: Sử dụng 'finsight_token' thay vì 'token'
      const token = localStorage.getItem('finsight_token');
      console.log('[AffiliateQuery] Fetching stats with token from:', `${API_URL}/stats`);
      
      const { data } = await axios.get(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[AffiliateQuery] Received data:', data);
      return data.data;
    },
    retry: 1,
    staleTime: 0
  });
};
