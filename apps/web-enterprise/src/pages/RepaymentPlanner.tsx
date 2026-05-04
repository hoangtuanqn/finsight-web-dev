import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Save,
  ShieldCheck,
  Snowflake,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { RepaymentStrategy, useRepaymentPlanner } from '../hooks/useRepaymentPlanner';

const STRATEGIES = [
  {
    id: RepaymentStrategy.AVALANCHE,
    name: 'Avalanche',
    description: 'Ưu tiên lãi suất cao nhất để tiết kiệm chi phí lãi vay tối đa.',
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
  },
  {
    id: RepaymentStrategy.SNOWBALL,
    name: 'Snowball',
    description: 'Ưu tiên số dư nhỏ nhất để tất toán nhanh các khoản nợ lẻ.',
    icon: Snowflake,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
  },
  {
    id: RepaymentStrategy.OVERDUE_FIRST,
    name: 'Quá hạn trước',
    description: 'Tập trung xử lý nợ quá hạn để tránh phạt và rủi ro pháp lý.',
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/30',
  },
  {
    id: RepaymentStrategy.COVENANT_RISK,
    name: 'Covenant Risk',
    description: 'Bảo vệ các điều khoản vay ngân hàng, tránh bị thu hồi nợ trước hạn.',
    icon: ShieldCheck,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/30',
  },
];

export default function RepaymentPlanner() {
  const { simulate, commitPlan, loading, committing, result } = useRepaymentPlanner();

  const [budget, setBudget] = useState<number>(100000000); // Default 100M
  const [strategy, setStrategy] = useState<RepaymentStrategy>(RepaymentStrategy.AVALANCHE);
  const [excludeDebtIds, setExcludeDebtIds] = useState<string[]>([]);
  const [planName, setPlanName] = useState(`Kế hoạch trả nợ tháng ${new Date().getMonth() + 1}`);

  const handleSimulate = () => {
    simulate(budget, strategy, excludeDebtIds);
  };

  const handleCommit = () => {
    if (!result) return;
    const items = result.debts.map((d) => ({
      debtId: d.debtId,
      plannedAmount: d.plannedAmount,
      priority: d.priority,
      reason: d.reason,
    }));
    commitPlan(planName, budget, strategy, items);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-(--color-text-primary) tracking-tight">Kế hoạch Trả nợ Thông minh</h1>
          <p className="text-(--color-text-muted) mt-2 max-w-2xl">
            Tối ưu hóa dòng tiền doanh nghiệp bằng cách phân bổ ngân sách trả nợ theo các chiến lược tài chính tiên
            tiến.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-(--color-bg-secondary) border border-(--color-border) flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-(--color-text-primary)">
              Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-(--color-bg-secondary)/50 backdrop-blur-xl border border-(--color-border) shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />

            <h2 className="text-lg font-semibold text-(--color-text-primary) mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              Thiết lập Ngân sách
            </h2>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-(--color-text-muted)">Ngân sách hàng tháng</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-32 px-3 py-1 rounded-lg bg-(--color-bg-secondary)/50 border border-(--color-border) text-right text-sm font-bold text-blue-400 focus:outline-none focus:border-blue-500/50"
                    />
                    <span className="text-[10px] text-(--color-text-muted) font-bold">VNĐ</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000000000"
                  step="10000000"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-1.5 bg-(--color-bg-secondary) rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-(--color-text-muted) font-medium">
                  <span>0đ</span>
                  <span>500M</span>
                  <span>1B+</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-(--color-text-muted)">Chiến lược ưu tiên</label>
                <div className="grid grid-cols-1 gap-3">
                  {STRATEGIES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStrategy(s.id)}
                      className={`p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${
                        strategy === s.id
                          ? `${s.bg} ${s.border} ring-1 ring-${s.color.split('-')[1]}-500/20`
                          : 'bg-transparent border-(--color-border) hover:bg-(--color-bg-secondary)'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-xl ${strategy === s.id ? 'bg-white/10' : 'bg-(--color-bg-secondary)'}`}
                        >
                          <s.icon className={`w-5 h-5 ${strategy === s.id ? s.color : 'text-(--color-text-muted)'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span
                              className={`font-semibold ${strategy === s.id ? s.color : 'text-(--color-text-primary)'}`}
                            >
                              {s.name}
                            </span>
                            {strategy === s.id && (
                              <motion.div layoutId="active-dot" className="w-2 h-2 rounded-full bg-blue-400" />
                            )}
                          </div>
                          <p className="text-xs text-(--color-text-muted) mt-1 leading-relaxed">{s.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-(--color-text-muted)">Loại trừ khoản nợ</label>
                  <span className="text-[10px] text-(--color-text-muted) uppercase">Tùy chọn</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 p-3 rounded-2xl bg-(--color-bg-secondary)/30 border border-(--color-border) custom-scrollbar">
                  {result?.debts?.map((d) => (
                    <label key={d.debtId} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={excludeDebtIds.includes(d.debtId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExcludeDebtIds([...excludeDebtIds, d.debtId]);
                            } else {
                              setExcludeDebtIds(excludeDebtIds.filter((id) => id !== d.debtId));
                            }
                          }}
                          className="peer appearance-none w-5 h-5 rounded-lg border border-(--color-border) checked:bg-blue-500 checked:border-transparent transition-all"
                        />
                        <CheckCircle2 className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                      </div>
                      <span className="text-xs text-(--color-text-muted) group-hover:text-(--color-text-primary) transition-colors truncate">
                        {d.debtName}
                      </span>
                    </label>
                  ))}
                  {(!result || result.debts.length === 0) && (
                    <p className="text-[10px] text-(--color-text-muted) italic text-center py-4">
                      Chưa có dữ liệu nợ để loại trừ
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSimulate}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <TrendingDown className="w-5 h-5" />
                    Chạy Mô phỏng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col items-center justify-center p-12 rounded-3xl bg-(--color-bg-secondary)/20 border-2 border-dashed border-(--color-border)"
              >
                <div className="w-20 h-20 rounded-full bg-(--color-bg-secondary) flex items-center justify-center mb-6">
                  <Calculator className="w-10 h-10 text-(--color-text-muted)" />
                </div>
                <h3 className="text-xl font-semibold text-(--color-text-primary)">Chưa có mô phỏng</h3>
                <p className="text-(--color-text-muted) text-center mt-2 max-w-sm">
                  Thiết lập ngân sách và chọn chiến lược bên trái để hệ thống tính toán phương án trả nợ tối ưu nhất.
                </p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Alerts Section */}
                {result.alerts.length > 0 && (
                  <div className="space-y-3">
                    {result.alerts.map((alert, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl border flex items-start gap-3 ${
                          alert.type === 'DANGER'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : alert.type === 'WARNING'
                              ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}
                      >
                        {alert.type === 'DANGER' ? (
                          <AlertCircle className="w-5 h-5 shrink-0" />
                        ) : alert.type === 'WARNING' ? (
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                        ) : (
                          <Info className="w-5 h-5 shrink-0" />
                        )}
                        <p className="text-sm font-medium">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-(--color-bg-secondary)/50 border border-(--color-border)">
                    <p className="text-xs text-(--color-text-muted) uppercase tracking-wider font-semibold">
                      Đã phân bổ
                    </p>
                    <p className="text-xl font-bold text-(--color-text-primary) mt-1">
                      {formatCurrency(result.summary.totalAllocated)}
                    </p>
                    <div className="mt-2 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(result.summary.totalAllocated / result.summary.totalBudget) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-(--color-bg-secondary)/50 border border-(--color-border)">
                    <p className="text-xs text-(--color-text-muted) uppercase tracking-wider font-semibold">
                      Ngân sách còn dư
                    </p>
                    <p className="text-xl font-bold text-green-400 mt-1">
                      {formatCurrency(result.summary.remainingBudget)}
                    </p>
                    <p className="text-[10px] text-(--color-text-muted) mt-1">Sẽ được chuyển sang tháng sau</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-(--color-bg-secondary)/50 border border-(--color-border)">
                    <p className="text-xs text-(--color-text-muted) uppercase tracking-wider font-semibold">
                      Tất toán hoàn toàn
                    </p>
                    <p className="text-xl font-bold text-yellow-400 mt-1">{result.summary.fullyPaidCount} khoản nợ</p>
                    <p className="text-[10px] text-(--color-text-muted) mt-1">Trong đợt phân bổ này</p>
                  </div>
                </div>

                {/* Debts Table */}
                <div className="p-1 rounded-3xl bg-(--color-bg-secondary)/30 border border-(--color-border) overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-(--color-bg-secondary)/50">
                          <th className="px-6 py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-widest w-16">
                            Thứ tự
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-widest">
                            Khoản nợ
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-widest">
                            Dư nợ hiện tại
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-widest">
                            Phân bổ tháng này
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-widest">
                            Dự báo tất toán
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--color-border)">
                        {result.debts.map((debt, idx) => (
                          <motion.tr
                            key={debt.debtId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`group hover:bg-(--color-bg-secondary)/50 transition-colors ${debt.plannedAmount === 0 ? 'opacity-50' : ''}`}
                          >
                            <td className="px-6 py-5">
                              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-(--color-bg-secondary) text-sm font-bold text-(--color-text-muted) group-hover:text-blue-400 transition-colors">
                                {debt.priority}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div>
                                <p className="font-bold text-(--color-text-primary) flex items-center gap-2">
                                  {debt.debtName}
                                  {debt.plannedAmount >= debt.outstanding && debt.outstanding > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase">
                                      Tất toán
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-(--color-text-muted) mt-0.5">{debt.partyName}</p>
                                <div className="mt-2 flex items-center gap-1.5">
                                  {(() => {
                                    const s = STRATEGIES.find((s) => s.id === strategy);
                                    if (!s) return null;
                                    const Icon = s.icon;
                                    return <Icon className={`w-4 h-4 ${s.color}`} />;
                                  })()}
                                  <span className="text-[10px] text-(--color-text-muted) italic">{debt.reason}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-sm font-semibold text-(--color-text-primary)">
                                {formatCurrency(debt.outstanding)}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="space-y-1">
                                <span className="text-sm font-bold text-blue-400">
                                  {formatCurrency(debt.plannedAmount)}
                                </span>
                                {debt.plannedAmount > 0 && (
                                  <p className="text-[10px] text-(--color-text-muted)">
                                    Còn lại: {formatCurrency(debt.remainingAfter)}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              {debt.isDebtTrap ? (
                                <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold bg-red-400/10 px-3 py-1 rounded-full w-fit">
                                  <AlertCircle className="w-3 h-3" /> Bẫy nợ
                                </span>
                              ) : debt.monthsToPayoff === 'NEVER' ? (
                                <span className="text-xs text-(--color-text-muted)">Không khả thi</span>
                              ) : debt.plannedAmount > 0 ? (
                                <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold bg-green-400/10 px-3 py-1 rounded-full w-fit">
                                  <Clock className="w-3 h-3" /> {debt.monthsToPayoff} tháng
                                </span>
                              ) : (
                                <span className="text-xs text-(--color-text-muted)">N/A</span>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 rounded-3xl bg-(--color-bg-secondary)/50 border border-(--color-border)">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-(--color-text-muted) uppercase tracking-widest">
                      Tên kế hoạch trả nợ
                    </label>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="bg-transparent border-b border-(--color-border) focus:border-blue-400 outline-none text-lg font-bold text-(--color-text-primary) w-full min-w-[300px]"
                    />
                  </div>
                  <button
                    onClick={handleCommit}
                    disabled={committing}
                    className="px-8 py-4 rounded-2xl bg-white text-black font-bold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {committing ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Lưu & Kích hoạt Kế hoạch
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
