import { useState, useEffect } from 'react';
import { debtAPI, marketAPI } from '../../../api/index.js';

/**
 * Fetches all dashboard data: debts summary + market sentiment.
 * Also listens for the `Finsight:DebtUpdated` event to auto-refresh.
 */
export function useDashboardData() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [debtsRes, sentimentRes] = await Promise.all([
          debtAPI.getAll().catch(() => ({ data: { data: { debts: [], summary: {} } } })),
          marketAPI.getSentiment().catch(() => ({
            data: { data: { fearGreed: { value: 50, labelVi: 'Trung lập' } } },
          })),
        ]);

        setData({
          debts:     debtsRes.data.data,
          sentiment: sentimentRes.data.data.fearGreed,
        });
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };

    load();

    window.addEventListener('Finsight:DebtUpdated', load);
    return () => window.removeEventListener('Finsight:DebtUpdated', load);
  }, []);

  return { data, loading };
}
