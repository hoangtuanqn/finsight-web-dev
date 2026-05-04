import { Button } from '@repo/ui';
import { AlertCircle, CheckCircle2, Play, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../../api';

interface DebtStatusActionsProps {
  debt: any;
  onUpdate: () => void;
}

export default function DebtStatusActions({ debt, onUpdate }: DebtStatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

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
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Thao tác thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  if (debt.status === 'PAID' || debt.status === 'WRITTEN_OFF') return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {debt.status === 'DRAFT' && (
        <Button
          onClick={() => handleAction('activate')}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Play className="w-4 h-4 mr-2" />
          Kích hoạt khoản nợ
        </Button>
      )}

      {['ACTIVE', 'PARTIAL', 'OVERDUE'].includes(debt.status) && (
        <>
          <Button
            onClick={() => {
              const reason = window.prompt('Nhập lý do tranh chấp:');
              if (reason) handleAction('dispute', reason);
            }}
            disabled={isLoading}
            className="px-4 py-2 border border-amber-500 text-amber-600 rounded-md hover:bg-amber-50"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Báo tranh chấp
          </Button>

          <Button
            onClick={() => {
              const reason = window.prompt('Nhập lý do xóa nợ (Write-off):');
              if (reason) handleAction('write-off', reason);
            }}
            disabled={isLoading}
            className="px-4 py-2 border border-red-500 text-red-600 rounded-md hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Xóa nợ
          </Button>
        </>
      )}

      {debt.status === 'DISPUTED' && (
        <Button
          onClick={() => handleAction('resolve')}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Giải quyết tranh chấp
        </Button>
      )}
    </div>
  );
}
