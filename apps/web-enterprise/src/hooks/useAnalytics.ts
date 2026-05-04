import axios from 'axios';
import { useCallback, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/enterprise/analytics/summary`, {
        withCredentials: true,
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi lấy dữ liệu tổng quan');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAgingReport = useCallback(async (type: 'RECEIVABLE' | 'PAYABLE' = 'RECEIVABLE') => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/enterprise/analytics/aging?type=${type}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi lấy báo cáo tuổi nợ');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCashFlow = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/enterprise/analytics/cash-flow`, {
        withCredentials: true,
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi lấy dự báo dòng tiền');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getActionItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/enterprise/analytics/action-items`, {
        withCredentials: true,
      });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi lấy danh sách việc cần làm');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getSummary,
    getAgingReport,
    getCashFlow,
    getActionItems,
  };
};
