import { Button } from '@repo/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Mail, Phone, ShieldCheck, User, X } from 'lucide-react';
import React from 'react';

interface PartyDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  party: any;
  auditLogs: any[];
  onEdit: () => void;
  onToggleStatus: (status: string) => void;
  formatCurrency: (amount: number) => string;
  getStatusStyle: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

export const PartyDetailDrawer: React.FC<PartyDetailDrawerProps> = ({
  isOpen,
  onClose,
  party,
  auditLogs,
  onEdit,
  onToggleStatus,
  formatCurrency,
  getStatusStyle,
  getStatusLabel,
}) => {
  if (!party) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[500px] bg-slate-900 border-l border-slate-800 shadow-2xl z-[101] overflow-hidden flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Building2 size={28} className="text-emerald-400" />
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">{party.name}</h2>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-0.5 text-[10px] font-black rounded-full border ${getStatusStyle(party.status)}`}
                >
                  {getStatusLabel(party.status)}
                </span>
                {party.isRelatedParty && (
                  <span className="px-3 py-0.5 text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full uppercase">
                    Nội Bộ
                  </span>
                )}
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Basic Info Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Thông tin chi tiết
                  </span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Mã số nội bộ</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">{party.internalCode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Mã số thuế</p>
                    <p className="text-sm font-bold text-white font-mono">{party.taxCode || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Hạn mức nợ</p>
                    <p className="text-sm font-bold text-white font-mono">{formatCurrency(party.creditLimit)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Ngày gia nhập</p>
                    <p className="text-sm font-bold text-white">
                      {new Date(party.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      <ShieldCheck size={16} />
                    </div>
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                      Người phụ trách nội bộ
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pl-1">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-slate-700">
                      {party.personInCharge?.fullName?.charAt(0) || 'N'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{party.personInCharge?.fullName || 'Chưa gán'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{party.personInCharge?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts Section */}
              {party.contacts && party.contacts.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Người liên hệ
                    </span>
                    <div className="h-px flex-1 bg-slate-800" />
                  </div>
                  <div className="space-y-4">
                    {party.contacts.map((contact: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 bg-slate-950/30 rounded-[1.5rem] border border-slate-800/50 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 p-3">
                          <User
                            size={16}
                            className="text-slate-800 group-hover:text-emerald-500/20 transition-colors"
                          />
                        </div>
                        <p className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                          {contact.name}
                          {contact.isPrimary && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                              Chính
                            </span>
                          )}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Mail size={12} className="text-slate-600" /> {contact.email || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Phone size={12} className="text-slate-600" /> {contact.phone || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Log Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Lịch sử hoạt động
                  </span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>
                <div className="space-y-6 pl-2">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log, idx) => (
                      <div
                        key={log.id}
                        className="relative pl-6 border-l border-slate-800 last:border-transparent pb-6 last:pb-0"
                      >
                        <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-slate-800 border border-slate-700" />
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300">
                              {log.action === 'CREATE'
                                ? 'Khởi tạo đối tác'
                                : log.action === 'UPDATE'
                                  ? 'Cập nhật thông tin'
                                  : log.action === 'TOGGLE_STATUS'
                                    ? `Thay đổi trạng thái: ${getStatusLabel(log.newValues?.status)}`
                                    : log.action}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">
                              {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Thực hiện bởi <span className="text-emerald-400 font-bold">{log.user?.fullName}</span>
                          </p>
                          {log.reason && (
                            <div className="mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-amber-500/80 italic">
                              Lý do: {log.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">Chưa có lịch sử ghi lại</p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex items-center gap-3">
              <Button
                appName="web-enterprise"
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm"
                onClick={onEdit}
              >
                Chỉnh Sửa
              </Button>
              <Button
                appName="web-enterprise"
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm"
                onClick={() => onToggleStatus(party.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
              >
                {party.status === 'ACTIVE' ? 'Ngừng hoạt động' : 'Kích hoạt lại'}
              </Button>
              <Button
                appName="web-enterprise"
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm"
                onClick={() => onToggleStatus('BLACKLIST')}
              >
                Blacklist
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
