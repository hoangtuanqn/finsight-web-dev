import { type InterestMethod } from '@repo/financial-core';
import { Button, Input, Modal } from '@repo/ui';
import { Calculator, FileText, Lock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../../api';
import { InterestRateSection, type InterestRateBracket, type InterestRateType } from './InterestRateSection';

interface DebtEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: any;
  internalUsers: any[];
  parties: any[];
  onSuccess: () => void;
}

export const DebtEditModal: React.FC<DebtEditModalProps> = ({
  isOpen,
  onClose,
  debt,
  internalUsers,
  parties,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'financial' | 'other'>('financial');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDraft = debt?.status === 'DRAFT';

  const [interestRateType, setInterestRateType] = useState<InterestRateType>('FIXED');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (!debt) return;

    // Detect interestRateType từ dữ liệu hiện có
    const rates: any[] = debt.interestRates || [];
    let detectedType: InterestRateType = 'FIXED';
    if (rates.length > 1) {
      const hasFixed = rates.some((r: any) => r.rateType === 'FIXED' || !r.rateType);
      const hasFloating = rates.some((r: any) => r.rateType === 'FLOATING');
      if (hasFixed && hasFloating) detectedType = 'MIXED';
      else if (hasFloating) detectedType = 'FLOATING';
      else detectedType = 'STEP';
    } else if (rates[0]?.rateType === 'REFERENCE') {
      detectedType = 'REFERENCE';
    } else if (rates[0]?.rateType === 'FLOATING') {
      detectedType = 'FLOATING';
    } else {
      detectedType = 'FIXED';
    }
    setInterestRateType(detectedType);

    const today = new Date().toISOString().split('T')[0];
    const mappedRates: InterestRateBracket[] =
      rates.length > 0
        ? rates.map((r: any) => ({
            rate: r.rate,
            effectiveDate: r.effectiveDate?.split('T')[0] || today,
            rateType: r.rateType || 'FIXED',
            referenceBase: r.referenceBase || '',
            spread: r.spread ?? 0,
          }))
        : [{ rate: 0, effectiveDate: today, rateType: 'FIXED' }];

    setFormData({
      principal: debt.principal,
      interestMethod: debt.interestMethod as InterestMethod,
      termMonths:
        debt.termMonths ||
        Math.round(
          (new Date(debt.dueDate).getTime() - new Date(debt.issueDate).getTime()) / (1000 * 60 * 60 * 24 * 30),
        ),
      issueDate: debt.issueDate?.split('T')[0] || today,
      interestRates: mappedRates,
      penaltyRate: debt.penaltyRate ?? 0,
      gracePeriodDays: debt.gracePeriodDays ?? 0,
      personInChargeId: debt.personInChargeId || '',
      internalCode: debt.internalCode || '',
      guarantorId: debt.guarantorId || '',
      notes: debt.notes || '',
    });
  }, [debt]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (isDraft) {
      if (!formData.principal || Number(formData.principal) <= 0) newErrors.principal = 'Số tiền gốc phải lớn hơn 0';
      if (!formData.termMonths || Number(formData.termMonths) <= 0) newErrors.termMonths = 'Thời hạn phải lớn hơn 0';
      if (!formData.issueDate) newErrors.issueDate = 'Vui lòng chọn ngày phát sinh';
      formData.interestRates?.forEach((r: any, i: number) => {
        if (r.rate < 0) newErrors[`interestRate_${i}`] = 'Lãi suất không được âm';
      });
    }
    if (!formData.internalCode?.trim()) newErrors.internalCode = 'Mã tham chiếu không được trống';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }
    setIsLoading(true);
    try {
      const payload: any = {
        notes: formData.notes,
        penaltyRate: Number(formData.penaltyRate),
        gracePeriodDays: Number(formData.gracePeriodDays),
        personInChargeId: formData.personInChargeId || null,
        internalCode: formData.internalCode,
        guarantorId: formData.guarantorId || null,
      };
      if (isDraft) {
        payload.principal = Number(formData.principal);
        payload.interestMethod = formData.interestMethod;
        payload.termMonths = Number(formData.termMonths);
        payload.issueDate = formData.issueDate;
        payload.interestRates = formData.interestRates;
      }
      await (enterpriseAuthAPI as any).updateDebt(debt.id, payload);
      toast.success('Đã cập nhật khoản nợ');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi cập nhật');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterestRateChange = (index: number, field: string, value: any) => {
    const newRates = [...formData.interestRates];
    newRates[index] = { ...newRates[index], [field]: value };
    setFormData({ ...formData, interestRates: newRates });
    const errorKey = `interestRate_${index}`;
    if (errors[errorKey]) setErrors({ ...errors, [errorKey]: '' });
  };

  const handleRateTypeChange = (type: InterestRateType) => {
    setInterestRateType(type);
    const today = new Date().toISOString().split('T')[0];
    const defaults: Record<InterestRateType, any[]> = {
      FIXED: [{ rate: 0, effectiveDate: today, rateType: 'FIXED' }],
      FLOATING: [{ rate: 0, effectiveDate: today, rateType: 'FLOATING' }],
      REFERENCE: [{ rate: 0, effectiveDate: today, rateType: 'REFERENCE', referenceBase: '', spread: 0 }],
      MIXED: [{ rate: 0, effectiveDate: today, rateType: 'FIXED' }],
      STEP: [{ rate: 0, effectiveDate: today, rateType: 'FLOATING' }],
    };
    setFormData({ ...formData, interestRates: defaults[type] });
  };

  const addRate = () => {
    const today = new Date().toISOString().split('T')[0];
    const newBracket =
      interestRateType === 'REFERENCE'
        ? { rate: 0, effectiveDate: today, rateType: 'REFERENCE', referenceBase: '', spread: 0 }
        : interestRateType === 'MIXED'
          ? { rate: 0, effectiveDate: today, rateType: 'FIXED' }
          : { rate: 0, effectiveDate: today, rateType: interestRateType === 'FIXED' ? 'FIXED' : 'FLOATING' };
    setFormData({ ...formData, interestRates: [...formData.interestRates, newBracket] });
  };

  const removeRate = (index: number) => {
    if (formData.interestRates.length === 1) return;
    const newRates = [...formData.interestRates];
    newRates.splice(index, 1);
    setFormData({ ...formData, interestRates: newRates });
  };

  if (!debt) return null;

  const tabs = [
    { id: 'financial', label: 'Thông tin tài chính', icon: Calculator },
    { id: 'other', label: 'Thông tin khác', icon: FileText },
  ] as const;

  const inputClass =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all';
  const disabledInputClass =
    'w-full bg-slate-900/50 border border-slate-800/50 rounded-xl px-4 py-3 text-sm text-slate-500 outline-none cursor-not-allowed';
  const labelClass = 'text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa Khoản nợ"
      className="max-w-[780px] w-full overflow-hidden"
    >
      <div className="flex flex-col h-[65vh] -m-6">
        {/* Tabs */}
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
                    ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-emerald-400' : 'text-slate-600'} />
                {tab.label}
                {isActive && <div className="w-1 h-1 rounded-full bg-emerald-500 ml-1 animate-pulse" />}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {/* ── Tab: Tài chính ── */}
          {activeTab === 'financial' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {!isDraft && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                  <Lock size={16} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-400/80">
                    Khoản nợ đang <span className="font-black">{debt.status}</span> — chỉ có thể chỉnh sửa thông tin bổ
                    sung. Thông tin tài chính bị khóa.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={labelClass}>Số tiền gốc (VND)</label>
                  {isDraft ? (
                    <>
                      <input
                        type="number"
                        className={`${inputClass} font-mono${errors.principal ? ' border-rose-500/50' : ''}`}
                        value={formData.principal || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, principal: e.target.value });
                          if (errors.principal) setErrors({ ...errors, principal: '' });
                        }}
                      />
                      {errors.principal && <p className="text-[10px] text-rose-500 ml-1">{errors.principal}</p>}
                    </>
                  ) : (
                    <input
                      className={disabledInputClass}
                      value={new Intl.NumberFormat('vi-VN').format(formData.principal)}
                      readOnly
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Thời hạn (Tháng)</label>
                  {isDraft ? (
                    <>
                      <input
                        type="number"
                        className={`${inputClass}${errors.termMonths ? ' border-rose-500/50' : ''}`}
                        value={formData.termMonths || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, termMonths: e.target.value });
                          if (errors.termMonths) setErrors({ ...errors, termMonths: '' });
                        }}
                      />
                      {errors.termMonths && <p className="text-[10px] text-rose-500 ml-1">{errors.termMonths}</p>}
                    </>
                  ) : (
                    <input className={disabledInputClass} value={formData.termMonths} readOnly />
                  )}
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Ngày phát sinh</label>
                  {isDraft ? (
                    <input
                      type="date"
                      className={`${inputClass}${errors.issueDate ? ' border-rose-500/50' : ''}`}
                      value={formData.issueDate || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, issueDate: e.target.value });
                        if (errors.issueDate) setErrors({ ...errors, issueDate: '' });
                      }}
                    />
                  ) : (
                    <input className={disabledInputClass} value={formData.issueDate} readOnly />
                  )}
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Phương thức tính lãi</label>
                  {isDraft ? (
                    <select
                      className={inputClass}
                      value={formData.interestMethod || ''}
                      onChange={(e) => setFormData({ ...formData, interestMethod: e.target.value as InterestMethod })}
                    >
                      <option value="REDUCING_BALANCE">Dư nợ giảm dần</option>
                      <option value="EMI">Trả đều (EMI)</option>
                      <option value="BULLET">Bullet (Gốc cuối kỳ)</option>
                      <option value="NONE">Không tính lãi</option>
                    </select>
                  ) : (
                    <input className={disabledInputClass} value={formData.interestMethod} readOnly />
                  )}
                </div>
              </div>

              {isDraft && formData.interestMethod !== 'NONE' && formData.interestRates && (
                <InterestRateSection
                  interestRateType={interestRateType}
                  interestRates={formData.interestRates}
                  errors={errors}
                  onTypeChange={handleRateTypeChange}
                  onAdd={addRate}
                  onRemove={removeRate}
                  onChange={handleInterestRateChange}
                />
              )}
            </div>
          )}

          {/* ── Tab: Thông tin khác ── */}
          {activeTab === 'other' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={labelClass}>Mã tham chiếu (Số HĐ) *</label>
                  <Input
                    placeholder="VD: HĐ-2024-001"
                    className={`${inputClass}${errors.internalCode ? ' border-rose-500/50' : ''}`}
                    value={formData.internalCode || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, internalCode: e.target.value });
                      if (errors.internalCode) setErrors({ ...errors, internalCode: '' });
                    }}
                  />
                  {errors.internalCode && <p className="text-[10px] text-rose-500 ml-1">{errors.internalCode}</p>}
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Người phụ trách</label>
                  <select
                    className={inputClass}
                    value={formData.personInChargeId || ''}
                    onChange={(e) => setFormData({ ...formData, personInChargeId: e.target.value })}
                  >
                    <option value="">Không có</option>
                    {internalUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.roleTitle || 'Nhân viên'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Bên bảo lãnh</label>
                  <select
                    className={inputClass}
                    value={formData.guarantorId || ''}
                    onChange={(e) => setFormData({ ...formData, guarantorId: e.target.value })}
                  >
                    <option value="">Không có</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.internalCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Tỷ lệ phạt (%/ngày)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      className={`${inputClass} pr-16 font-mono`}
                      value={formData.penaltyRate ?? ''}
                      onChange={(e) => setFormData({ ...formData, penaltyRate: e.target.value })}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none">
                      %/ngày
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 ml-1">0.0003 = 0.03%/ngày (mức chuẩn luật VN)</p>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Grace Period (Ngày)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={formData.gracePeriodDays ?? ''}
                    onChange={(e) => setFormData({ ...formData, gracePeriodDays: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Ghi chú</label>
                <textarea
                  rows={4}
                  className={`${inputClass} resize-none`}
                  placeholder="Nhập ghi chú hoặc điều khoản bổ sung..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-slate-800/50 bg-slate-950/20">
          <div className="flex gap-2">
            {activeTab === 'other' && (
              <Button
                appName="web-enterprise"
                type="button"
                className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors border border-slate-700"
                onClick={() => setActiveTab('financial')}
              >
                Quay lại
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button
              appName="web-enterprise"
              type="button"
              className="px-5 py-2.5 text-slate-400 font-bold hover:text-white transition-colors"
              onClick={onClose}
            >
              Hủy
            </Button>
            {activeTab === 'financial' ? (
              <Button
                appName="web-enterprise"
                type="button"
                className="px-7 py-2.5 bg-slate-800 border border-slate-700 text-white font-black rounded-xl hover:bg-slate-700 transition-all text-xs uppercase tracking-widest"
                onClick={() => setActiveTab('other')}
              >
                Tiếp theo
              </Button>
            ) : (
              <Button
                appName="web-enterprise"
                type="button"
                disabled={isLoading}
                className="px-7 py-2.5 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                onClick={handleSubmit}
              >
                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
