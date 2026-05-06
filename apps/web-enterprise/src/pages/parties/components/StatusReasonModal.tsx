import { Button, Modal } from '@repo/ui';
import React from 'react';

interface StatusReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pendingStatus: string;
  reason: string;
  setReason: (reason: string) => void;
  isUpdatingStatus: boolean;
  getStatusLabel: (status: string) => string;
}

export const StatusReasonModal: React.FC<StatusReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pendingStatus,
  reason,
  setReason,
  isUpdatingStatus,
  getStatusLabel,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận thay đổi trạng thái"
      className="max-w-[500px] w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
    >
      <div className="space-y-6">
        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-500 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
            </svg>
          </div>
          <p className="text-[13px] text-amber-900 dark:text-amber-200/80 leading-relaxed font-bold">
            Việc thay đổi trạng thái sẽ được lưu vào nhật ký hệ thống để phục vụ đối soát và kiểm toán.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-black text-slate-900 dark:text-slate-300 ml-1">
            Lý do chuyển sang trạng thái:{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-black">{getStatusLabel(pendingStatus)}</span>
          </label>
          <textarea
            className="w-full h-32 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium"
            placeholder="Nhập lý do chi tiết..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          <Button
            appName="web-enterprise"
            className="px-6 py-2.5 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            appName="web-enterprise"
            className="px-8 py-2.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-slate-900/20 dark:shadow-emerald-500/20 transition-all"
            onClick={onConfirm}
            disabled={isUpdatingStatus || !reason.trim()}
          >
            {isUpdatingStatus ? 'Đang cập nhật...' : 'Xác nhận thay đổi'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
