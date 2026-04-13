import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { debtAPI } from '../../api/index.js';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import { formatVND } from '../../utils/calculations';

export default function RepaymentPlanPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [extraBudget, setExtraBudget] = useState(1000000);

  const load = (budget) => {
    setLoading(true);
    debtAPI.getRepaymentPlan({ extraBudget: budget })
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setTimeout(() => setLoading(false), 400));
  };

  useEffect(() => { load(extraBudget); }, []);

  const handleBudgetChange = (val) => {
    setExtraBudget(val);
    load(val);
  };

  if (loading && !data) return <PageSkeleton />;

  const { avalanche, snowball, comparison, recommendation } = data || {};

  const timelineData = [];
  if (avalanche?.schedule && snowball?.schedule) {
    const maxMonths = Math.max(avalanche.months, snowball.months, 1);
    for (let m = 0; m <= Math.min(maxMonths, 24); m++) {
      const avMonth = avalanche.schedule[m];
      const snMonth = snowball.schedule[m];
      const avBalance = avMonth ? avMonth.payments.reduce((s, p) => s + p.balance, 0) : 0;
      const snBalance = snMonth ? snMonth.payments.reduce((s, p) => s + p.balance, 0) : 0;
      timelineData.push({ month: `T${m + 1}`, avalanche: Math.round(avBalance), snowball: Math.round(snBalance) });
    }
  }

  const tooltipStyle = {
    background: '#111827',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    fontSize: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-white">📋 Kế hoạch trả nợ</h1>
        <p className="text-slate-500 text-sm mt-1">So sánh Avalanche vs Snowball để chọn chiến lược tối ưu</p>
      </div>

      {/* Budget Slider */}
      <div className="glass-card mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <span>💰</span> Ngân sách trả thêm mỗi tháng
          </label>
          <span className="text-base font-bold text-blue-400">{formatVND(extraBudget)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="5000000"
          step="100000"
          value={extraBudget}
          onChange={e => handleBudgetChange(+e.target.value)}
          className="w-full"
        />
        <div className="flex justify-between text-[11px] text-slate-600 mt-2">
          <span>0đ</span><span>1tr</span><span>2.5tr</span><span>5tr</span>
        </div>
      </div>

      {!data || !avalanche ? (
        <div className="glass-card text-center py-16">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-slate-500">Không có khoản nợ nào để tính</p>
        </div>
      ) : (
        <>
          {/* Strategy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
              style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-xl">⚡</span>
                <h3 className="font-semibold text-blue-400">Avalanche</h3>
                <span className="text-[10px] bg-blue-500/12 px-2 py-0.5 rounded-full text-blue-300 font-medium">Tiết kiệm lãi</span>
              </div>
              <p className="text-[12px] text-slate-500 mb-4">Ưu tiên trả nợ lãi suất CAO nhất trước</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">Thời gian</p>
                  <p className="text-xl font-bold text-white">{avalanche.months} <span className="text-sm text-slate-400">tháng</span></p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">Tổng lãi</p>
                  <p className="text-xl font-bold text-red-400">{formatVND(avalanche.totalInterest)}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card"
              style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-xl">🎯</span>
                <h3 className="font-semibold text-emerald-400">Snowball</h3>
                <span className="text-[10px] bg-emerald-500/12 px-2 py-0.5 rounded-full text-emerald-300 font-medium">Động lực tâm lý</span>
              </div>
              <p className="text-[12px] text-slate-500 mb-4">Ưu tiên trả nợ DƯ NỢ nhỏ nhất trước</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">Thời gian</p>
                  <p className="text-xl font-bold text-white">{snowball.months} <span className="text-sm text-slate-400">tháng</span></p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">Tổng lãi</p>
                  <p className="text-xl font-bold text-red-400">{formatVND(snowball.totalInterest)}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Savings */}
          {comparison && comparison.savedInterest > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card mb-6 bg-gradient-to-r from-emerald-500/5 to-blue-500/5"
              style={{ borderColor: 'rgba(16, 185, 129, 0.15)' }}
            >
              <p className="text-center text-emerald-400 font-medium text-sm">
                💡 Avalanche giúp tiết kiệm <span className="font-bold">{formatVND(comparison.savedInterest)}</span> tiền lãi
                {comparison.savedMonths > 0 && ` và trả xong sớm hơn ${comparison.savedMonths} tháng`}
              </p>
            </motion.div>
          )}

          {/* AI Recommendation */}
          {recommendation && (
            <div className="glass-card mb-6 bg-blue-500/3" style={{ borderColor: 'rgba(59, 130, 246, 0.12)' }}>
              <p className="text-sm text-blue-300">
                🤖 <span className="font-semibold">AI khuyến nghị:</span> {recommendation}
              </p>
            </div>
          )}

          {/* Timeline Chart */}
          {timelineData.length > 0 && (
            <div className="glass-card">
              <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
                <span>📉</span> Tiến trình giảm nợ
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickFormatter={v => `${(v/1000000).toFixed(1)}tr`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatVND(v), '']} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="avalanche" name="Avalanche" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="snowball" name="Snowball" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
