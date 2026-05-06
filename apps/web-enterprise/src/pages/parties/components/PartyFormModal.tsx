import { Button, Input, Modal } from '@repo/ui';
import { Banknote, Building2, Contact, User } from 'lucide-react';
import React, { useState } from 'react';
import FormattedInput from '../../../components/common/FormattedInput';
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

const VIETNAM_BANKS = [
  'Vietcombank (VCB)',
  'BIDV',
  'VietinBank',
  'Agribank',
  'Techcombank',
  'MB Bank',
  'VPBank',
  'ACB',
  'Sacombank',
  'TPBank',
  'VIB',
  'HDBank',
  'SHB',
  'MSB',
  'SeABank',
  'LienVietPostBank',
  'Nam A Bank',
  'OCB',
  'Eximbank',
];

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tabs = [
    { id: 'general', label: 'Thông tin chung', icon: Building2 },
    { id: 'contact', label: 'Người liên hệ', icon: Contact },
    { id: 'bank', label: 'Ngân hàng', icon: Banknote },
  ] as const;

  const validateStep = (step: 'general' | 'contact' | 'bank') => {
    const newErrors: Record<string, string> = {};

    if (step === 'general') {
      if (!formData.name?.trim()) newErrors.name = 'Tên đối tác là bắt buộc';
      if (!formData.internalCode?.trim()) newErrors.internalCode = 'Mã nội bộ là bắt buộc';
      if (formData.typeTags?.length === 0) newErrors.typeTags = 'Vui lòng chọn ít nhất một vai trò';
    }

    if (step === 'contact') {
      const contacts = formData.contacts || [];
      if (contacts.length === 0 || !contacts[0]?.name?.trim()) {
        newErrors.contactName = 'Tên người liên hệ chính là bắt buộc';
      }
    }

    if (step === 'bank') {
      const bankAccounts = formData.bankAccounts || [];
      if (bankAccounts.length === 0) {
        newErrors.bank = 'Vui lòng thêm ít nhất một tài khoản ngân hàng';
      } else {
        const lastBank = bankAccounts[bankAccounts.length - 1];
        if (!lastBank.bankName?.trim()) newErrors.bankName = 'Tên ngân hàng là bắt buộc';
        if (!lastBank.accountNumber?.trim()) newErrors.accountNumber = 'Số tài khoản là bắt buộc';
        if (!lastBank.accountHolder?.trim()) newErrors.accountHolder = 'Chủ tài khoản là bắt buộc';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab !== 'bank') {
      if (validateStep(activeTab)) {
        if (activeTab === 'general') setActiveTab('contact');
        else if (activeTab === 'contact') setActiveTab('bank');
      }
      return;
    }

    if (validateStep('bank')) {
      onSubmit(e);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Cập nhật Đối Tác' : 'Đăng ký Đối Tác Mới'}
      className="max-w-[800px] w-full overflow-hidden"
    >
      <div className="flex flex-col h-[60vh] -m-6">
        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 p-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800/50">
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
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] ring-1 ring-emerald-500/20'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800/30'
                }`}
              >
                <Icon
                  size={16}
                  className={isActive ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}
                />
                {tab.label}
                {isActive && <div className="w-1 h-1 rounded-full bg-emerald-500 ml-1 animate-pulse" />}
              </button>
            );
          })}

          {!isEdit && (
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  name: 'Công ty TNHH Hòa Bình',
                  shortName: 'Hoa Binh Construction',
                  taxCode: '0302568421',
                  internalCode: 'SUP-HBC-001',
                  creditLimit: 1000000000,
                  typeTags: ['SUPPLIER', 'INTERNAL'],
                  isRelatedParty: false,
                  personInChargeId: internalUsers[0]?.id || '',
                  contacts: [
                    {
                      name: 'Lê Hoàng Nam',
                      position: 'Giám đốc Dự án',
                      phone: '0912345678',
                      email: 'nam.le@hoabinh.vn',
                      isPrimary: true,
                    },
                  ],
                  bankAccounts: [
                    {
                      bankName: 'Vietcombank (VCB)',
                      accountNumber: '0071001234567',
                      accountHolder: 'CONG TY CP XD HOA BINH',
                      branch: 'Chi nhánh TP.HCM',
                    },
                  ],
                });
                setErrors({});
              }}
              className="ml-2 px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-tighter bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
            >
              🚀 Nhập Nhanh
            </button>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeTab === 'general' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Section 1: Basic Info */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                        Tên Pháp Nhân *
                      </label>
                      <Input
                        placeholder="Công ty TNHH FinSight"
                        className={`w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none ${
                          errors.name ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/5' : ''
                        }`}
                        value={formData.name || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                      />
                      {errors.name && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.name}</p>}
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                        Tên Viết Tắt
                      </label>
                      <Input
                        placeholder="Ví dụ: FinSight Solutions"
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                        value={formData.shortName || ''}
                        onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                        Mã Số Thuế
                      </label>
                      <Input
                        placeholder="0123456789"
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-mono"
                        value={formData.taxCode || ''}
                        onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                        Mã Nội Bộ *
                      </label>
                      <Input
                        placeholder="C001"
                        className={`w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none ${
                          errors.internalCode ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/5' : ''
                        }`}
                        value={formData.internalCode || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, internalCode: e.target.value });
                          if (errors.internalCode) setErrors({ ...errors, internalCode: '' });
                        }}
                      />
                      {errors.internalCode && (
                        <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.internalCode}</p>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                        Hạn Mức Tín Dụng (VND)
                      </label>
                      <FormattedInput
                        placeholder="500,000,000"
                        className="w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-mono"
                        value={formData.creditLimit}
                        onValueChange={(val) => setFormData({ ...formData, creditLimit: Number(val) })}
                        suffix="đ"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                        Người Phụ Trách
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none appearance-none cursor-pointer"
                          value={formData.personInChargeId || ''}
                          onChange={(e) => setFormData({ ...formData, personInChargeId: e.target.value })}
                        >
                          <option value="" className="bg-white dark:bg-slate-900">
                            Chọn nhân viên
                          </option>
                          {internalUsers.map((u) => (
                            <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900">
                              {u.fullName} ({u.roleTitle || 'Nhân viên'})
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                          <User size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Roles */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-300">VAI TRÒ ĐỐI TÁC</h4>
                      {errors.typeTags && <p className="text-red-500 text-[10px] mt-1">{errors.typeTags}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                          formData.isRelatedParty
                            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                        }`}
                        onClick={() => setFormData({ ...formData, isRelatedParty: !formData.isRelatedParty })}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                            formData.isRelatedParty
                              ? 'border-emerald-500 dark:border-emerald-400'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {formData.isRelatedParty && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                          )}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider">Bên Liên Quan</span>
                      </div>
                    </div>
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
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/20'
                            : 'bg-white dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-300 shadow-sm dark:shadow-none'
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
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                      Họ Tên Người Liên Hệ *
                    </label>
                    <Input
                      placeholder="Nguyễn Văn A"
                      value={formData.contacts?.[0]?.name || ''}
                      onChange={(e) => {
                        const current = formData.contacts || [];
                        const first = current[0] || { name: '', position: '', email: '', phone: '', isPrimary: true };
                        const updated = [{ ...first, name: e.target.value }, ...current.slice(1)];
                        setFormData({ ...formData, contacts: updated });
                        if (errors.contactName) setErrors({ ...errors, contactName: '' });
                      }}
                      className={`w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none ${
                        errors.contactName ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/5' : ''
                      }`}
                    />
                    {errors.contactName && <p className="text-red-500 text-xs mt-1 ml-1">{errors.contactName}</p>}
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                      Chức vụ
                    </label>
                    <Input
                      placeholder="Giám đốc Tài chính"
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 transition-all outline-none"
                      value={formData.contacts?.[0]?.position || ''}
                      onChange={(e) => {
                        const current = formData.contacts || [];
                        const first = current[0] || { name: '', position: '', email: '', phone: '', isPrimary: true };
                        const updated = [{ ...first, position: e.target.value }, ...current.slice(1)];
                        setFormData({ ...formData, contacts: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                      Số điện thoại
                    </label>
                    <Input
                      placeholder="091 234 5678"
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 transition-all outline-none"
                      value={formData.contacts?.[0]?.phone || ''}
                      onChange={(e) => {
                        const current = formData.contacts || [];
                        const first = current[0] || { name: '', position: '', email: '', phone: '', isPrimary: true };
                        const updated = [{ ...first, phone: e.target.value }, ...current.slice(1)];
                        setFormData({ ...formData, contacts: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="binh.nguyen@beta-xd.vn"
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 transition-all outline-none"
                      value={formData.contacts?.[0]?.email || ''}
                      onChange={(e) => {
                        const current = formData.contacts || [];
                        const first = current[0] || { name: '', position: '', email: '', phone: '', isPrimary: true };
                        const updated = [{ ...first, email: e.target.value }, ...current.slice(1)];
                        setFormData({ ...formData, contacts: updated });
                      }}
                    />
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 dark:border-emerald-500/10 rounded-2xl">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-relaxed font-black">
                    Lưu ý: Đây là thông tin liên hệ chính sẽ được sử dụng để gửi các thông báo nhắc nợ tự động qua
                    Email/Zalo.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {errors.bank && <p className="text-red-500 text-xs">{errors.bank}</p>}
                {(formData.bankAccounts?.length
                  ? formData.bankAccounts
                  : [{ bankName: '', accountNumber: '', accountHolder: '', branch: '' }]
                ).map((bank: any, index: number) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50"
                  >
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                        Tên Ngân hàng *
                      </label>
                      <div className="relative">
                        <select
                          className={`w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white appearance-none focus:outline-none focus:border-emerald-500/50 transition-all ${
                            errors.bankName && index === (formData.bankAccounts?.length || 1) - 1
                              ? 'border-red-500/50'
                              : ''
                          }`}
                          value={bank.bankName || ''}
                          onChange={(e) => {
                            const updated = [...(formData.bankAccounts || [])];
                            if (updated.length === 0)
                              updated.push({ bankName: '', accountNumber: '', accountHolder: '', branch: '' });
                            updated[index] = { ...bank, bankName: e.target.value };
                            setFormData({ ...formData, bankAccounts: updated });
                            if (errors.bankName) setErrors({ ...errors, bankName: '' });
                          }}
                        >
                          <option
                            value=""
                            disabled
                            className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500"
                          >
                            Chọn ngân hàng...
                          </option>
                          {VIETNAM_BANKS.map((b) => (
                            <option
                              key={b}
                              value={b}
                              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            >
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.bankName && index === (formData.bankAccounts?.length || 1) - 1 && (
                        <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.bankName}</p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                        Số Tài Khoản *
                      </label>
                      <Input
                        placeholder="0071001234567"
                        className={`w-full bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-mono ${
                          errors.accountNumber && index === (formData.bankAccounts?.length || 1) - 1
                            ? 'border-red-500/50'
                            : ''
                        }`}
                        value={bank.accountNumber || ''}
                        onChange={(e) => {
                          const updated = [...(formData.bankAccounts || [])];
                          if (updated.length === 0)
                            updated.push({ bankName: '', accountNumber: '', accountHolder: '', branch: '' });
                          updated[index] = { ...bank, accountNumber: e.target.value };
                          setFormData({ ...formData, bankAccounts: updated });
                          if (errors.accountNumber) setErrors({ ...errors, accountNumber: '' });
                        }}
                      />
                      {errors.accountNumber && index === (formData.bankAccounts?.length || 1) - 1 && (
                        <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.accountNumber}</p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                        Tên Chủ Tài Khoản *
                      </label>
                      <Input
                        placeholder="CONG TY CP BETA XAY DUNG"
                        className={`w-full bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white uppercase ${
                          errors.accountHolder && index === (formData.bankAccounts?.length || 1) - 1
                            ? 'border-red-500/50'
                            : ''
                        }`}
                        value={bank.accountHolder || ''}
                        onChange={(e) => {
                          const updated = [...(formData.bankAccounts || [])];
                          if (updated.length === 0)
                            updated.push({ bankName: '', accountNumber: '', accountHolder: '', branch: '' });
                          updated[index] = { ...bank, accountHolder: e.target.value };
                          setFormData({ ...formData, bankAccounts: updated });
                          if (errors.accountHolder) setErrors({ ...errors, accountHolder: '' });
                        }}
                      />
                      {errors.accountHolder && index === (formData.bankAccounts?.length || 1) - 1 && (
                        <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.accountHolder}</p>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-400 ml-1 uppercase tracking-wider">
                        Chi nhánh
                      </label>
                      <Input
                        placeholder="Chi nhánh Quận 1"
                        className="w-full bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white focus:border-emerald-500/50 transition-all outline-none"
                        value={bank.branch || ''}
                        onChange={(e) => {
                          const updated = [...(formData.bankAccounts || [])];
                          if (updated.length === 0)
                            updated.push({ bankName: '', accountNumber: '', accountHolder: '', branch: '' });
                          updated[index] = { ...bank, branch: e.target.value };
                          setFormData({ ...formData, bankAccounts: updated });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 p-8 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="flex gap-2">
              {activeTab !== 'general' && (
                <Button
                  appName="web-enterprise"
                  type="button"
                  className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none"
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
                className="px-6 py-2.5 text-slate-400 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }}
              >
                Hủy
              </Button>

              <Button
                appName="web-enterprise"
                type={activeTab === 'bank' ? 'submit' : 'button'}
                className={`px-8 py-2.5 font-black rounded-xl shadow-lg transition-all uppercase tracking-widest text-xs ${
                  activeTab === 'bank'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-800 dark:border-slate-700 hover:bg-slate-800 dark:hover:bg-slate-700'
                }`}
                onClick={(e) => {
                  if (activeTab !== 'bank') {
                    e.preventDefault();
                    if (activeTab === 'general') setActiveTab('contact');
                    else if (activeTab === 'contact') setActiveTab('bank');
                  }
                }}
              >
                {activeTab === 'bank' ? (isEdit ? 'Cập Nhật' : 'Xác nhận Đăng ký') : 'Tiếp theo'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
