import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { enterpriseAuthAPI } from '../../api/index';

interface ExecutionItem {
  debtId: string;
  debtName: string;
  partyName: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
  priority: number;
}

interface ExecutionReport {
  plan: {
    id: string;
    name: string;
    budget: number;
    strategy: string;
  } | null;
  summary: {
    totalPlanned: number;
    totalActual: number;
    complianceRate: number;
    priorityViolation: boolean;
    itemsCount: number;
    compliantCount: number;
  };
  items: ExecutionItem[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const RepaymentExecutionReport: React.FC = () => {
  const [report, setReport] = useState<ExecutionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await enterpriseAuthAPI.getExecutionReport(selectedMonth, selectedYear);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch report', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!report?.plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-(--color-bg-secondary)/30 rounded-3xl border border-(--color-border-primary) border-dashed">
        <Calendar className="w-12 h-12 text-(--color-text-muted) mb-4" />
        <h3 className="text-lg font-bold text-(--color-text-primary)">Chưa có kế hoạch cho tháng này</h3>
        <p className="text-sm text-(--color-text-muted) mt-2 text-center max-w-md">
          Bạn cần chốt (Commit) một kế hoạch trả nợ trước để hệ thống có thể đối soát với các giao dịch thực tế.
        </p>
      </div>
    );
  }

  const { summary, items } = report;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-(--color-bg-secondary) rounded-3xl border border-(--color-border-primary)">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h2 className="font-bold text-(--color-text-primary)">
            Báo cáo đối soát tháng {selectedMonth}/{selectedYear}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-(--color-bg-primary) border border-(--color-border-primary) rounded-xl px-3 py-1.5 text-xs font-bold text-(--color-text-primary) outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Tháng {i + 1}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-(--color-bg-primary) border border-(--color-border-primary) rounded-xl px-3 py-1.5 text-xs font-bold text-(--color-text-primary) outline-none focus:ring-1 focus:ring-blue-500"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
          <button
            onClick={fetchReport}
            className="p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-(--color-bg-secondary) border border-(--color-border-primary)">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Tỷ lệ tuân thủ</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-(--color-text-primary)">{summary.complianceRate.toFixed(1)}%</div>
          <div className="mt-2 h-1.5 w-full bg-(--color-bg-primary) rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                summary.complianceRate >= 90
                  ? 'bg-green-500'
                  : summary.complianceRate >= 50
                    ? 'bg-orange-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${summary.complianceRate}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-(--color-bg-secondary) border border-(--color-border-primary)">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">
              Thực chi vs Kế hoạch
            </span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-(--color-text-primary)">{formatCurrency(summary.totalActual)}</div>
          <div className="text-[10px] text-(--color-text-muted) mt-1">
            Trên kế hoạch {formatCurrency(summary.totalPlanned)}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-(--color-bg-secondary) border border-(--color-border-primary)">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">
              Khoản nợ hoàn thành
            </span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-black text-(--color-text-primary)">
            {summary.compliantCount} / {summary.itemsCount}
          </div>
          <div className="text-[10px] text-(--color-text-muted) mt-1 uppercase">Khoản nợ đã trả đúng kế hoạch</div>
        </div>

        <div
          className={`p-5 rounded-3xl border ${
            summary.priorityViolation ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Vi phạm ưu tiên</span>
            {summary.priorityViolation ? (
              <XCircle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </div>
          <div className={`text-sm font-bold ${summary.priorityViolation ? 'text-red-400' : 'text-green-400'}`}>
            {summary.priorityViolation ? 'Cảnh báo vi phạm Waterfall' : 'Tuân thủ đúng thứ tự ưu tiên'}
          </div>
          <p className="text-[10px] text-(--color-text-muted) mt-2 leading-relaxed">
            {summary.priorityViolation
              ? 'Có khoản nợ ưu tiên thấp được trả trước khoản ưu tiên cao.'
              : 'Thứ tự thanh toán khớp hoàn toàn với chiến lược đã chọn.'}
          </p>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-(--color-bg-secondary) rounded-3xl border border-(--color-border-primary) overflow-hidden">
        <div className="p-6 border-b border-(--color-border-primary) flex items-center justify-between">
          <h3 className="font-bold text-(--color-text-primary)">Chi tiết đối soát từng khoản nợ</h3>
          <span className="text-xs px-3 py-1 bg-(--color-bg-primary) rounded-full font-bold text-(--color-text-muted)">
            {report.plan.name}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-(--color-border-primary) bg-(--color-bg-primary)/30">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-(--color-text-muted)">Ưu tiên</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-(--color-text-muted)">
                  Khoản nợ / Đối tác
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-(--color-text-muted) text-right">
                  Kế hoạch
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-(--color-text-muted) text-right">
                  Thực tế
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-(--color-text-muted) text-right">
                  Chênh lệch
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-(--color-text-muted) text-center">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border-primary)">
              {items.map((item) => (
                <tr key={item.debtId} className="hover:bg-(--color-bg-primary)/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-(--color-bg-primary) text-[10px] font-black text-(--color-text-muted)">
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-(--color-text-primary) text-sm">{item.debtName}</div>
                    <div className="text-[10px] text-(--color-text-muted) mt-0.5">{item.partyName}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-sm">{formatCurrency(item.plannedAmount)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-(--color-text-primary) text-sm">
                      {formatCurrency(item.actualAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] font-bold ${
                        item.variance >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {item.variance >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {formatCurrency(Math.abs(item.variance))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {item.status === 'COMPLIANT' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black">
                          <CheckCircle2 className="w-3 h-3" /> ĐẠT
                        </div>
                      ) : item.status === 'PARTIAL' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black">
                          <AlertCircle className="w-3 h-3" /> MỘT PHẦN
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black">
                          <XCircle className="w-3 h-3" /> CHƯA TRẢ
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
