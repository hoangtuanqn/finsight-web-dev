import { Button, Input, Modal } from '@repo/ui';
import { User } from 'lucide-react';
import React from 'react';
import type { Party } from '../types';

interface PartyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: Partial<Party>;
  setFormData: (data: Partial<Party>) => void;
  internalUsers: any[];
  isEdit: boolean;
}

export const PartyFormModal: React.FC<PartyFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  internalUsers,
  isEdit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Cập nhật Đối Tác' : 'Đăng ký Đối Tác Mới'}
      className="max-w-[750px] w-full bg-slate-900 border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl"
    >
      <form onSubmit={onSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto px-4 pb-4 custom-scrollbar">
        {/* Section 1: Basic Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Thông tin cơ bản</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-400 ml-1">Tên Pháp Nhân *</label>
              <Input
                required
                placeholder="Ví dụ: Công ty TNHH Giải pháp FinSight"
                className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-400 ml-1">Tên Viết Tắt / Thương Hiệu</label>
              <Input
                placeholder="Ví dụ: FinSight Solutions"
                className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                value={formData.shortName}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-400 ml-1">Mã Số Thuế *</label>
              <Input
                required
                placeholder="0123456789"
                className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-mono"
                value={formData.taxCode}
                onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-400 ml-1">Hạn Mức Tín Dụng (VND)</label>
              <Input
                type="number"
                placeholder="500,000,000"
                className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-mono"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-400 ml-1">Người Phụ Trách</label>
              <div className="relative">
                <select
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none appearance-none cursor-pointer"
                  value={formData.personInChargeId || ''}
                  onChange={(e) => setFormData({ ...formData, personInChargeId: e.target.value })}
                >
                  <option value="" className="bg-slate-900">
                    Chọn nhân viên
                  </option>
                  {internalUsers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-900">
                      {u.fullName} ({u.roleTitle || 'Nhân viên'})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Roles */}
        <div className="space-y-4">
          <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-widest">Vai trò đối tác</label>
          <div className="flex flex-wrap gap-3">
            {['CUSTOMER', 'SUPPLIER', 'BANK', 'STATE', 'INTERNAL'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const currentTags = formData.typeTags || [];
                  const tags = currentTags.includes(tag)
                    ? currentTags.filter((t: string) => t !== tag)
                    : [...currentTags, tag];
                  setFormData({ ...formData, typeTags: tags });
                }}
                className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  formData.typeTags?.includes(tag)
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-950/30 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Primary Contact */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Người liên hệ chính
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-400 ml-1">Họ và Tên</label>
              <Input
                placeholder="Nguyễn Văn A"
                className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white"
                value={formData.contacts?.[0]?.name || ''}
                onChange={(e) => {
                  const newContacts = [
                    ...(formData.contacts || [{ name: '', position: '', email: '', phone: '', isPrimary: true }]),
                  ];
                  newContacts[0].name = e.target.value;
                  setFormData({ ...formData, contacts: newContacts });
                }}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-400 ml-1">Số điện thoại</label>
              <Input
                placeholder="090 123 4567"
                className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white"
                value={formData.contacts?.[0]?.phone || ''}
                onChange={(e) => {
                  const newContacts = [
                    ...(formData.contacts || [{ name: '', position: '', email: '', phone: '', isPrimary: true }]),
                  ];
                  newContacts[0].phone = e.target.value;
                  setFormData({ ...formData, contacts: newContacts });
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-800/50">
          <Button
            appName="web-enterprise"
            type="button"
            className="px-6 py-2.5 text-slate-400 font-bold hover:text-white transition-colors"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            appName="web-enterprise"
            type="submit"
            className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
          >
            {isEdit ? 'Cập Nhật' : 'Xác nhận Đăng ký'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
