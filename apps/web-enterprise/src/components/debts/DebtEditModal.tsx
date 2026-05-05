import { type InterestMethod } from '@repo/financial-core';
import { Button, Input, Modal } from '@repo/ui';
import { Calculator, Calendar, DollarSign, FileText, Info, Lock, Save, Unlock, User } from 'lucide-react';
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

const selectClass =
  'w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none appearance-none';
const inputClass =
  'w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none';
const disabledClass =
  'w-full px-4 py-3 bg-slate-900/40 border border-slate-800/40 rounded-xl text-sm text-slate-500 outline-none cursor-not-allowed';
const labelClass = 'text-xs font-black text-slate-500 uppercase tracking-widest ml-1';
const errorClass = 'text-[10px] font-bold text-rose-500 ml-1';

export const DebtEditModal: React.FC<DebtEditModalProps> = ({
  isOpen,
  onClose,
  debt,
  internalUsers,
  parties,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unlocked, setUnlocked] = useState(false);

  const isDraft = debt?.status === 'DRAFT';
  const canEditFinancial = isDraft || unlocked;

  const [interestRateType, setInterestRateType] = useState<InterestRateType>('FIXED');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (!isOpen || !debt) return;
    setUnlocked(false);
    setErrors({});

    const rates: any[] = debt.interestRates || [];
    let detectedType: InterestRateType = 'FIXED';
    if (rates.length > 1) {
      const hasFixed = rates.some((r: any) => r.rateType === 'FIXED' || !r.rateType);
      const hasFloating = rates.some((r: any) => r.rateType === 'FLOATING');
      if (hasFixed && hasFloating) detectedType = 'MIXED';
      else if (hasFloating) detectedType = 'FLOATING';
      else detectedType = 'STEP';
    } else if (rates[0]?.rateType === 'REFERENCE') detectedType = 'REFERENCE';
    else if (rates[0]?.rateType === 'FLOATING') detectedType = 'FLOATING';
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

    const termMonths =
      debt.termMonths ||
      Math.round((new Date(debt.dueDate).getTime() - new Date(debt.issueDate).getTime()) / (1000 * 60 * 60 * 24 * 30));

    setFormData({
      type: debt.type || 'RECEIVABLE',
      origin: debt.origin || 'TRADE',
      partyId: debt.partyId || '',
      internalCode: debt.internalCode || '',
      guarantorId: debt.guarantorId || '',
      personInChargeId: debt.personInChargeId || '',
      principal: debt.principal,
      termMonths,
      issueDate: debt.issueDate?.split('T')[0] || today,
      interestMethod: (debt.interestMethod as InterestMethod) || 'REDUCING_BALANCE',
      penaltyRate: debt.penaltyRate ?? 0,
      gracePeriodDays: debt.gracePeriodDays ?? 0,
      interestRates: mappedRates,
      notes: debt.notes || '',
    });
  }, [isOpen, debt]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.partyId) newErrors.partyId = 'Vui lòng chọn đối tác';
    if (!formData.internalCode?.trim()) newErrors.internalCode = 'Mã tham chiếu không được trống';
    if (!formData.personInChargeId) newErrors.personInChargeId = 'Vui lòng chọn người phụ trách';
    if (canEditFinancial) {
      if (!formData.principal || Number(formData.principal) <= 0) newErrors.principal = 'Số tiền gốc phải lớn hơn 0';
      if (!formData.termMonths || Number(formData.termMonths) <= 0) newErrors.termMonths = 'Thời hạn phải lớn hơn 0';
      if (!formData.issueDate) newErrors.issueDate = 'Vui lòng chọn ngày phát sinh';
      formData.interestRates?.forEach((r: any, i: number) => {
        if (r.rate < 0) newErrors[`interestRate_${i}`] = 'Lãi suất không được âm';
      });
    }
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
        partyId: formData.partyId,
        internalCode: formData.internalCode,
        guarantorId: formData.guarantorId || null,
        personInChargeId: formData.personInChargeId || null,
        notes: formData.notes,
        penaltyRate: Number(formData.penaltyRate),
        gracePeriodDays: Number(formData.gracePeriodDays),
        unlocked,
      };
      if (canEditFinancial) {
        payload.type = formData.type;
        payload.origin = formData.origin;
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
    if (errors[`interestRate_${index}`]) setErrors({ ...errors, [`interestRate_${index}`]: '' });
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa Khoản nợ"
      className="max-w-[860px] w-full overflow-hidden"
    >
      <div className="flex flex-col max-h-[80vh] -m-6">
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {/* ── Section: Thông tin chung ── */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <FileText size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Thông tin chung</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Loại nghiệp vụ */}
              <div className="space-y-2">
                <label className={labelClass}>Loại nghiệp vụ</label>
                {canEditFinancial ? (
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'RECEIVABLE' })}
                      className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${formData.type === 'RECEIVABLE' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Phải thu
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'PAYABLE' })}
                      className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${formData.type === 'PAYABLE' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Phải trả
                    </button>
                  </div>
                ) : (
                  <div className={`${disabledClass} flex items-center gap-2`}>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${formData.type === 'RECEIVABLE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}
                    >
                      {formData.type === 'RECEIVABLE' ? 'Phải thu' : 'Phải trả'}
                    </span>
                  </div>
                )}
              </div>

              {/* Nguồn gốc */}
              <div className="space-y-2">
                <label className={labelClass}>Nguồn gốc</label>
                {canEditFinancial ? (
                  <select
                    className={selectClass}
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  >
                    <option value="TRADE">Thương mại (Hợp đồng)</option>
                    <option value="FINANCIAL">Tài chính (Vay/Nợ)</option>
                    <option value="TAX">Thuế & Ngân sách</option>
                    <option value="BOND">Trái phiếu</option>
                    <option value="INTERNAL">Nội bộ</option>
                  </select>
                ) : (
                  <input className={disabledClass} value={formData.origin} readOnly />
                )}
              </div>

              {/* Đối tác */}
              <div className="space-y-2">
                <label className={labelClass}>Đối tác</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <User size={16} />
                  </div>
                  {canEditFinancial ? (
                    <select
                      className={`w-full pl-12 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none appearance-none ${errors.partyId ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'}`}
                      value={formData.partyId}
                      onChange={(e) => {
                        setFormData({ ...formData, partyId: e.target.value });
                        if (errors.partyId) setErrors({ ...errors, partyId: '' });
                      }}
                    >
                      <option value="">Chọn đối tác...</option>
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.internalCode})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={`${disabledClass} pl-12`}
                      value={parties.find((p) => p.id === formData.partyId)?.name || formData.partyId}
                      readOnly
                    />
                  )}
                </div>
                {errors.partyId && <p className={errorClass}>{errors.partyId}</p>}
              </div>

              {/* Mã tham chiếu */}
              <div className="space-y-2">
                <label className={labelClass}>Mã tham chiếu (Số HĐ)</label>
                <Input
                  placeholder="VD: HĐ-2024-001"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-sm text-white ${errors.internalCode ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'}`}
                  value={formData.internalCode || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, internalCode: e.target.value });
                    if (errors.internalCode) setErrors({ ...errors, internalCode: '' });
                  }}
                />
                {errors.internalCode && <p className={errorClass}>{errors.internalCode}</p>}
              </div>

              {/* Bên bảo lãnh */}
              <div className="space-y-2">
                <label className={labelClass}>Bên bảo lãnh (Tùy chọn)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <User size={16} />
                  </div>
                  <select
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none appearance-none"
                    value={formData.guarantorId || ''}
                    onChange={(e) => setFormData({ ...formData, guarantorId: e.target.value })}
                  >
                    <option value="">Không có bảo lãnh...</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.internalCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Người phụ trách */}
              <div className="space-y-2">
                <label className={labelClass}>Người Phụ Trách Nợ</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <User size={16} />
                  </div>
                  <select
                    className={`w-full pl-12 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none appearance-none ${errors.personInChargeId ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'}`}
                    value={formData.personInChargeId || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, personInChargeId: e.target.value });
                      if (errors.personInChargeId) setErrors({ ...errors, personInChargeId: '' });
                    }}
                  >
                    <option value="">Chọn nhân viên phụ trách...</option>
                    {internalUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.roleTitle || 'Nhân viên'})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.personInChargeId && <p className={errorClass}>{errors.personInChargeId}</p>}
              </div>
            </div>
          </div>

          {/* ── Section: Điều khoản tài chính ── */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <Calculator size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Điều khoản tài chính</h2>
              </div>
              {!isDraft && (
                <button
                  type="button"
                  onClick={() => setUnlocked((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    unlocked
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {unlocked ? (
                    <>
                      <Unlock size={13} /> Đang mở khóa
                    </>
                  ) : (
                    <>
                      <Lock size={13} /> Mở khóa sửa
                    </>
                  )}
                </button>
              )}
            </div>

            {!canEditFinancial && (
              <div className="flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
                <Lock size={15} className="text-slate-500 shrink-0" />
                <p className="text-xs text-slate-500">
                  Khoản nợ đang <span className="font-black text-slate-400">{debt.status}</span> — nhấn "Mở khóa sửa" để
                  chỉnh sửa thông tin tài chính. Lịch trả nợ sẽ được tính lại.
                </p>
              </div>
            )}

            {unlocked && !isDraft && (
              <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <Info size={15} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-400/80">
                  Cảnh báo: khoản nợ đã <span className="font-black">{debt.status}</span>. Thay đổi tài chính sẽ tái tạo
                  lịch trả nợ và ghi log kiểm toán.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Số tiền gốc */}
              <div className="space-y-2">
                <label className={labelClass}>Số tiền gốc (VND)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <DollarSign size={16} />
                  </div>
                  {canEditFinancial ? (
                    <Input
                      type="number"
                      className={`w-full pl-12 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white font-mono ${errors.principal ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'}`}
                      value={formData.principal || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, principal: e.target.value });
                        if (errors.principal) setErrors({ ...errors, principal: '' });
                      }}
                    />
                  ) : (
                    <input
                      className={`${disabledClass} pl-12 font-mono`}
                      value={new Intl.NumberFormat('vi-VN').format(formData.principal)}
                      readOnly
                    />
                  )}
                </div>
                {errors.principal && <p className={errorClass}>{errors.principal}</p>}
              </div>

              {/* Thời hạn */}
              <div className="space-y-2">
                <label className={labelClass}>Thời hạn (Tháng)</label>
                {canEditFinancial ? (
                  <Input
                    type="number"
                    className={`${inputClass} ${errors.termMonths ? 'border-rose-500/50 ring-2 ring-rose-500/10' : ''}`}
                    value={formData.termMonths || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, termMonths: e.target.value });
                      if (errors.termMonths) setErrors({ ...errors, termMonths: '' });
                    }}
                  />
                ) : (
                  <input className={disabledClass} value={formData.termMonths} readOnly />
                )}
                {errors.termMonths && <p className={errorClass}>{errors.termMonths}</p>}
              </div>

              {/* Ngày phát sinh */}
              <div className="space-y-2">
                <label className={labelClass}>Ngày phát sinh</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Calendar size={16} />
                  </div>
                  {canEditFinancial ? (
                    <Input
                      type="date"
                      className={`w-full pl-12 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white ${errors.issueDate ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'}`}
                      value={formData.issueDate || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, issueDate: e.target.value });
                        if (errors.issueDate) setErrors({ ...errors, issueDate: '' });
                      }}
                    />
                  ) : (
                    <input className={`${disabledClass} pl-12`} value={formData.issueDate} readOnly />
                  )}
                </div>
                {errors.issueDate && <p className={errorClass}>{errors.issueDate}</p>}
              </div>

              {/* Phương thức tính lãi */}
              <div className="space-y-2">
                <label className={labelClass}>Phương thức tính lãi</label>
                {canEditFinancial ? (
                  <select
                    className={selectClass}
                    value={formData.interestMethod}
                    onChange={(e) => setFormData({ ...formData, interestMethod: e.target.value as InterestMethod })}
                  >
                    <option value="REDUCING_BALANCE">Dư nợ giảm dần</option>
                    <option value="EMI">Trả đều (EMI)</option>
                    <option value="BULLET">Bullet (Gốc cuối kỳ)</option>
                    <option value="NONE">Không tính lãi</option>
                  </select>
                ) : (
                  <input className={disabledClass} value={formData.interestMethod} readOnly />
                )}
              </div>

              {/* Tỷ lệ phạt */}
              <div className="space-y-2">
                <label className={labelClass}>Tỷ lệ phạt (%/ngày)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Info size={16} />
                  </div>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="VD: 0.0003 cho 0.03%"
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                    value={formData.penaltyRate ?? ''}
                    onChange={(e) => setFormData({ ...formData, penaltyRate: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-slate-500 ml-1">0.03% (0.0003) là mức phạt chuẩn theo luật VN.</p>
              </div>

              {/* Grace Period */}
              <div className="space-y-2">
                <label className={labelClass}>Grace Period (Ngày)</label>
                <Input
                  type="number"
                  className={inputClass}
                  value={formData.gracePeriodDays ?? ''}
                  onChange={(e) => setFormData({ ...formData, gracePeriodDays: e.target.value })}
                />
              </div>
            </div>

            {/* Interest Rate Section */}
            {canEditFinancial && formData.interestMethod !== 'NONE' && formData.interestRates && (
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

            {!canEditFinancial && formData.interestRates?.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className={labelClass}>Lãi suất hiện tại</label>
                <div className="space-y-2">
                  {formData.interestRates.map((r: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-4 py-3 bg-slate-950/60 border border-slate-800/60 rounded-xl"
                    >
                      <span className="text-base font-mono font-black text-emerald-400">{r.rate}%</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">/năm</span>
                      {r.effectiveDate && <span className="text-xs text-slate-500 ml-auto">từ {r.effectiveDate}</span>}
                      {r.rateType && r.rateType !== 'FIXED' && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                          {r.rateType}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Section: Ghi chú ── */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-4">
            <label className={labelClass}>Ghi chú</label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-emerald-500/50 transition-all resize-none"
              placeholder="Nhập ghi chú hoặc điều khoản bổ sung..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-4 px-8 py-5 border-t border-slate-800/50 bg-slate-950/20 shrink-0">
          <Button
            appName="web-enterprise"
            type="button"
            className="px-6 py-2.5 text-slate-400 font-bold hover:text-white transition-colors"
            onClick={onClose}
          >
            Hủy bỏ
          </Button>
          <Button
            appName="web-enterprise"
            type="button"
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 cursor-pointer"
            onClick={handleSubmit}
          >
            <Save size={16} /> {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
