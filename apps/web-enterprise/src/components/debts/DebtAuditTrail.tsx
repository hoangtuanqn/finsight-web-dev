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

  // Hàm helper để định dạng ngày tháng
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

  if (isLoading) return <div className="animate-pulse h-20 bg-gray-50 rounded-lg"></div>;
  if (logs.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <History className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Nhật ký nghiệp vụ (Audit Trail)</h3>
          <p className="text-sm text-gray-500">Lịch sử thay đổi trạng thái và dấu vết hệ thống</p>
        </div>
      </div>

      <div className="relative border-l-2 border-gray-100 ml-4 pl-8 space-y-8">
        {logs.map((log) => (
          <div key={log.id} className="relative">
            {/* Timeline Dot */}
            <div className="absolute -left-[41px] mt-1.5 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{log.user.fullName}</p>
                    <p className="text-xs text-gray-400">{log.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(log.createdAt)}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-500 border border-gray-100">
                  {log.oldValues?.status || 'N/A'}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300" />
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                    log.newValues?.status === 'ACTIVE'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : log.newValues?.status === 'OVERDUE'
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : log.newValues?.status === 'PAID'
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : log.newValues?.status === 'DISPUTED'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-gray-50 text-gray-700 border-gray-100'
                  }`}
                >
                  {log.newValues?.status}
                </span>
              </div>

              {log.reason && (
                <div className="flex items-start gap-3 text-sm text-gray-600 bg-blue-50/30 p-3 rounded-xl border border-blue-50/50">
                  <Info className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                  <p className="italic leading-relaxed">"{log.reason}"</p>
                </div>
              )}

              {log.newValues?.outstandingSnapshot !== undefined && (
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Dư nợ tại thời điểm này
                  </span>
                  <span className="text-sm font-bold text-gray-700">
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
