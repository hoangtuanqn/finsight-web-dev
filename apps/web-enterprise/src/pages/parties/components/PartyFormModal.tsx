import { Button, Input, Modal } from '@repo/ui';
import { Banknote, Building2, Contact, User } from 'lucide-react';
import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'bank'>('general');

  const tabs = [
    { id: 'general', label: 'Thông tin chung', icon: Building2 },
    { id: 'contact', label: 'Người liên hệ', icon: Contact },
    { id: 'bank', label: 'Ngân hàng', icon: Banknote },
  ] as const;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Cập nhật Đối Tác' : 'Đăng ký Đối Tác Mới'}
      className="max-w-[800px] w-full overflow-hidden"
    >
      <div className="flex flex-col h-[60vh] -m-6">
        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 p-3 bg-slate-950/50 border-b border-slate-800/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-slate-600'} />
                {tab.label}
                {isActive && <div className="w-1 h-1 rounded-full bg-emerald-500 ml-1 animate-pulse" />}
              </button>
            );
          })}
        </div>

        <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeTab === 'general' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Section 1: Basic Info */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                        Tên Pháp Nhân *
                      </label>
                      <Input
                        required
                        placeholder="Ví dụ: Công ty TNHH Giải pháp FinSight"
                        className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                        Tên Viết Tắt
                      </label>
                      <Input
                        placeholder="Ví dụ: FinSight Solutions"
                        className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                        value={formData.shortName || ''}
                        onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                        Mã Nội Bộ
                      </label>
                      <Input
                        placeholder="Ví dụ: KH-001"
                        className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-mono"
                        value={formData.internalCode || ''}
                        onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                        Mã Số Thuế *
                      </label>
                      <Input
                        required
                        placeholder="0123456789"
                        className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-mono"
                        value={formData.taxCode || ''}
                        onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                        Hạn Mức Tín Dụng (VND)
                      </label>
                      <Input
                        type="number"
                        placeholder="500,000,000"
                        className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-mono"
                        value={formData.creditLimit}
                        onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                        Người Phụ Trách
                      </label>
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

                {/* Section: Roles */}
                <div className="space-y-4 pt-4 border-t border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-widest">
                      Vai trò đối tác
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div
                        className={`w-10 h-5 rounded-full p-1 transition-all ${formData.isRelatedParty ? 'bg-emerald-500' : 'bg-slate-800'}`}
                      >
                        <div
                          className={`w-3 h-3 bg-white rounded-full transition-all ${formData.isRelatedParty ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.isRelatedParty || false}
                        onChange={(e) => setFormData({ ...formData, isRelatedParty: e.target.checked })}
                      />
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                        Bên Liên Quan
                      </span>
                    </label>
                  </div>
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
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                      Họ và Tên
                    </label>
                    <Input
                      placeholder="Nguyễn Văn Bình"
                      className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white"
                      value={formData.contacts?.[0]?.name || ''}
                      onChange={(e) => {
                        const contacts = formData.contacts || [
                          { name: '', position: '', email: '', phone: '', isPrimary: true },
                        ];
                        const newContacts = [{ ...contacts[0], name: e.target.value }, ...contacts.slice(1)];
                        setFormData({ ...formData, contacts: newContacts });
                      }}
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                      Chức vụ
                    </label>
                    <Input
                      placeholder="Giám đốc Tài chính"
                      className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white"
                      value={formData.contacts?.[0]?.position || ''}
                      onChange={(e) => {
                        const contacts = formData.contacts || [
                          { name: '', position: '', email: '', phone: '', isPrimary: true },
                        ];
                        const newContacts = [{ ...contacts[0], position: e.target.value }, ...contacts.slice(1)];
                        setFormData({ ...formData, contacts: newContacts });
                      }}
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                      Số điện thoại
                    </label>
                    <Input
                      placeholder="091 234 5678"
                      className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white"
                      value={formData.contacts?.[0]?.phone || ''}
                      onChange={(e) => {
                        const contacts = formData.contacts || [
                          { name: '', position: '', email: '', phone: '', isPrimary: true },
                        ];
                        const newContacts = [{ ...contacts[0], phone: e.target.value }, ...contacts.slice(1)];
                        setFormData({ ...formData, contacts: newContacts });
                      }}
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">Email</label>
                    <Input
                      type="email"
                      placeholder="binh.nguyen@beta-xd.vn"
                      className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white"
                      value={formData.contacts?.[0]?.email || ''}
                      onChange={(e) => {
                        const contacts = formData.contacts || [
                          { name: '', position: '', email: '', phone: '', isPrimary: true },
                        ];
                        const newContacts = [{ ...contacts[0], email: e.target.value }, ...contacts.slice(1)];
                        setFormData({ ...formData, contacts: newContacts });
                      }}
                    />
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <p className="text-[10px] text-emerald-400 leading-relaxed font-medium">
                    Lưu ý: Đây là thông tin liên hệ chính sẽ được sử dụng để gửi các thông báo nhắc nợ tự động qua
                    Email/Zalo.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                      Tên Ngân hàng
                    </label>
                    <Input
                      placeholder="Ví dụ: Vietcombank"
                      className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white"
                      value={formData.bankAccounts?.[0]?.bankName || ''}
                      onChange={(e) => {
                        const banks = formData.bankAccounts || [
                          { bankName: '', accountNumber: '', accountHolder: '', branch: '' },
                        ];
                        const newBanks = [{ ...banks[0], bankName: e.target.value }, ...banks.slice(1)];
                        setFormData({ ...formData, bankAccounts: newBanks });
                      }}
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                      Số Tài Khoản
                    </label>
                    <Input
                      placeholder="0071001234567"
                      className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white font-mono"
                      value={formData.bankAccounts?.[0]?.accountNumber || ''}
                      onChange={(e) => {
                        const banks = formData.bankAccounts || [
                          { bankName: '', accountNumber: '', accountHolder: '', branch: '' },
                        ];
                        const newBanks = [{ ...banks[0], accountNumber: e.target.value }, ...banks.slice(1)];
                        setFormData({ ...formData, bankAccounts: newBanks });
                      }}
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                      Tên Chủ Tài Khoản
                    </label>
                    <Input
                      placeholder="CONG TY CP BETA XAY DUNG"
                      className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white uppercase"
                      value={formData.bankAccounts?.[0]?.accountHolder || ''}
                      onChange={(e) => {
                        const banks = formData.bankAccounts || [
                          { bankName: '', accountNumber: '', accountHolder: '', branch: '' },
                        ];
                        const newBanks = [{ ...banks[0], accountHolder: e.target.value }, ...banks.slice(1)];
                        setFormData({ ...formData, bankAccounts: newBanks });
                      }}
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 ml-1 uppercase tracking-wider">
                      Chi nhánh
                    </label>
                    <Input
                      placeholder="Chi nhánh Quận 1"
                      className="w-full bg-slate-950/50 border-slate-800 rounded-2xl p-4 text-white"
                      value={formData.bankAccounts?.[0]?.branch || ''}
                      onChange={(e) => {
                        const banks = formData.bankAccounts || [
                          { bankName: '', accountNumber: '', accountHolder: '', branch: '' },
                        ];
                        const newBanks = [{ ...banks[0], branch: e.target.value }, ...banks.slice(1)];
                        setFormData({ ...formData, bankAccounts: newBanks });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 p-8 border-t border-slate-800/50 bg-slate-950/20">
            <div className="flex gap-2">
              {activeTab !== 'general' && (
                <Button
                  appName="web-enterprise"
                  type="button"
                  className="px-6 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors"
                  onClick={() => {
                    if (activeTab === 'bank') setActiveTab('contact');
                    else if (activeTab === 'contact') setActiveTab('general');
                  }}
                >
                  Quay lại
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Button
                appName="web-enterprise"
                type="button"
                className="px-6 py-2.5 text-slate-400 font-bold hover:text-white transition-colors"
                onClick={onClose}
              >
                Hủy
              </Button>

              {activeTab !== 'bank' ? (
                <Button
                  appName="web-enterprise"
                  type="button"
                  className="px-8 py-2.5 bg-slate-800 text-white font-bold rounded-xl border border-slate-700 hover:bg-slate-700"
                  onClick={() => {
                    if (activeTab === 'general') setActiveTab('contact');
                    else if (activeTab === 'contact') setActiveTab('bank');
                  }}
                >
                  Tiếp theo
                </Button>
              ) : (
                <Button
                  appName="web-enterprise"
                  type="submit"
                  className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  {isEdit ? 'Cập Nhật' : 'Xác nhận Đăng ký'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
