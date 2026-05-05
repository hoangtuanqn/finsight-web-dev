import { AlertCircle, CheckCircle2, Play, ShieldCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../../api';
import StatusActionModal from './StatusActionModal';

interface DebtStatusActionsProps {
  debt: any;
  onUpdate: () => void;
  onRecordPayment?: () => void;
}

export default function DebtStatusActions({ debt, onUpdate, onRecordPayment }: DebtStatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'dispute' | 'write-off' | null;
  }>({
    isOpen: false,
    type: null,
  });

  const handleAction = async (action: string, reason?: string) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'activate':
          await (enterpriseAuthAPI as any).activateDebt(debt.id);
          toast.success('Đã kích hoạt khoản nợ');
          break;
        case 'dispute':
          await (enterpriseAuthAPI as any).disputeDebt(debt.id, reason || '');
          toast.success('Đã chuyển sang trạng thái tranh chấp');
          break;
        case 'resolve':
          await (enterpriseAuthAPI as any).resolveDispute(debt.id);
          toast.success('Đã giải quyết tranh chấp');
          break;
        case 'write-off':
          await (enterpriseAuthAPI as any).writeOffDebt(debt.id, reason || '');
          toast.success('Đã xóa nợ');
          break;
      }
      onUpdate();
      setModalConfig({ isOpen: false, type: null });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Thao tác thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  if (debt.status === 'PAID' || debt.status === 'WRITTEN_OFF') return null;

  return (
    <div className="flex flex-wrap items-center gap-3 mt-6">
      {debt.status === 'DRAFT' && (
        <button
          onClick={() => handleAction('activate')}
          disabled={isLoading}
          className="group flex items-center gap-2 px-6 py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-500 dark:hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <Play size={14} className="fill-current group-hover:scale-125 transition-transform" />
          KÍCH HOẠT KHOẢN NỢ
        </button>
      )}

      {['ACTIVE', 'PARTIAL', 'OVERDUE'].includes(debt.status) && (
        <>
          <button
            onClick={onRecordPayment}
            disabled={isLoading}
            className="group flex items-center gap-2 px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-xs font-black rounded-xl hover:bg-blue-500 dark:hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 size={14} className="group-hover:scale-125 transition-transform" />
            GHI NHẬN THANH TOÁN
          </button>

          <button
            onClick={() => setModalConfig({ isOpen: true, type: 'dispute' })}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-500 text-xs font-bold rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all active:scale-95"
          >
            <AlertCircle size={14} />
            BÁO TRANH CHẤP
          </button>

          <button
            onClick={() => setModalConfig({ isOpen: true, type: 'write-off' })}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
          >
            <XCircle size={14} />
            XÓA NỢ
          </button>
        </>
      )}

      {debt.status === 'DISPUTED' && (
        <button
          onClick={() => handleAction('resolve')}
          disabled={isLoading}
          className="group flex items-center gap-2 px-6 py-2.5 bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-black rounded-xl hover:bg-emerald-500 dark:hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <ShieldCheck size={14} className="group-hover:scale-125 transition-transform" />
          GIẢI QUYẾT TRANH CHẤP
        </button>
      )}

      {/* Confirmation Modals */}
      <StatusActionModal
        isOpen={modalConfig.isOpen && modalConfig.type === 'dispute'}
        onClose={() => setModalConfig({ isOpen: false, type: null })}
        onConfirm={(reason) => handleAction('dispute', reason)}
        title="Báo cáo tranh chấp"
        description="Khoản nợ sẽ được chuyển sang trạng thái tranh chấp. Vui lòng cung cấp lý do chi tiết để các bên cùng theo dõi."
        confirmLabel="Xác nhận tranh chấp"
        confirmVariant="warning"
        isLoading={isLoading}
      />

      <StatusActionModal
        isOpen={modalConfig.isOpen && modalConfig.type === 'write-off'}
        onClose={() => setModalConfig({ isOpen: false, type: null })}
        onConfirm={(reason) => handleAction('write-off', reason)}
        title="Xác nhận xóa nợ"
        description="Thao tác này sẽ đánh dấu khoản nợ là không thể thu hồi (Write-off). Đây là hành động không thể hoàn tác trong luồng thông thường."
        confirmLabel="Xác nhận xóa nợ"
        confirmVariant="danger"
        isLoading={isLoading}
      />
    </div>
  );
}
