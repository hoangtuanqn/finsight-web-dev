import { useCallback, useState } from 'react';
import api from '../api';

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/v1/enterprise/analytics/summary');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi khi lấy dữ liệu tổng quan');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAgingReport = useCallback(async (type: 'RECEIVABLE' | 'PAYABLE' = 'RECEIVABLE') => {
    setLoading(true);
    try {
      const response = await api.get(`/v1/enterprise/analytics/aging?type=${type}`);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi khi lấy báo cáo tuổi nợ');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCashFlow = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/v1/enterprise/analytics/cash-flow');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi khi lấy dự báo dòng tiền');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getActionItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/v1/enterprise/analytics/action-items');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi khi lấy danh sách việc cần làm');
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
