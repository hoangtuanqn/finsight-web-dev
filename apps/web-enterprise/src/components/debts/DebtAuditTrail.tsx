import { ArrowRight, Clock, History, Info, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { enterpriseAuthAPI } from '../../api';

interface AuditLog {
  id: string;
  action: string;
  oldValues: any;
  newValues: any;
  reason: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

export default function DebtAuditTrail({ debtId }: { debtId: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await (enterpriseAuthAPI as any).getDebtAuditLogs(debtId);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [debtId]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-slate-100/50 dark:bg-slate-800/40 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700/50"
          ></div>
        ))}
      </div>
    );

  if (logs.length === 0)
    return (
      <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <History className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Chưa có nhật ký nghiệp vụ nào được ghi nhận</p>
      </div>
    );

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
            <History className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Nhật ký nghiệp vụ</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Lịch sử thay đổi trạng thái và dấu vết hệ thống
            </p>
          </div>
        </div>
        <div className="hidden sm:block px-4 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {logs.length} bản ghi
        </div>
      </div>

      <div className="relative ml-4 pl-8 space-y-10">
        {/* Timeline Line */}
        <div className="absolute left-0 top-2 bottom-0 w-[2px] bg-gradient-to-b from-emerald-500 via-slate-200 dark:via-slate-800 to-transparent"></div>

        {logs.map((log) => (
          <div key={log.id} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[43px] top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:scale-125 transition-transform duration-300 z-10"></div>

            <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/60 shadow-sm group-hover:shadow-xl group-hover:shadow-emerald-500/5 group-hover:border-emerald-500/20 transition-all duration-300">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 transition-colors">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{log.user.fullName}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{log.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(log.createdAt)}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-5 p-2 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/30 w-fit">
                <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                  {log.oldValues?.status || 'BẮT ĐẦU'}
                </span>
                <ArrowRight className="w-4 h-4 text-emerald-500" />
                <span
                  className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                    log.newValues?.status === 'ACTIVE'
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20'
                      : log.newValues?.status === 'OVERDUE'
                        ? 'bg-red-500 text-white border-red-400 shadow-red-500/20'
                        : log.newValues?.status === 'PAID'
                          ? 'bg-blue-500 text-white border-blue-400 shadow-blue-500/20'
                          : log.newValues?.status === 'DISPUTED'
                            ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'
                            : 'bg-slate-700 text-white border-slate-600'
                  }`}
                >
                  {log.newValues?.status}
                </span>
              </div>

              {log.reason && (
                <div className="flex items-start gap-4 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200 dark:border-slate-700/50">
                  <Info className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="italic leading-relaxed font-medium">"{log.reason}"</p>
                </div>
              )}

              {log.newValues?.outstandingSnapshot !== undefined && (
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                    Dư nợ Snapshot
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                    {formatCurrency(log.newValues.outstandingSnapshot)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
