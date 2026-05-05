import { generateSchedule, type InterestMethod } from '@repo/financial-core';
import { Button, Input } from '@repo/ui';
import { motion } from 'framer-motion';
import {
  Calculator,
  Calendar,
  ChevronRight,
  DollarSign,
  FileText,
  Info,
  Lock,
  Save,
  Unlock,
  User,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../../api';
import { InterestRateSection, type InterestRateType } from '../../components/debts/InterestRateSection';
import { SchedulePreview } from '../../components/debts/SchedulePreview';

export default function DebtEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [parties, setParties] = useState<any[]>([]);
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [interestRateType, setInterestRateType] = useState<InterestRateType>('FIXED');

  const [formData, setFormData] = useState<any>({
    type: 'RECEIVABLE',
    partyId: '',
    guarantorId: '',
    origin: 'TRADE',
    principal: 0,
    interestMethod: 'REDUCING_BALANCE' as InterestMethod,
    issueDate: new Date().toISOString().split('T')[0],
    termMonths: 12,
    interestRates: [{ rate: 0, effectiveDate: new Date().toISOString().split('T')[0], rateType: 'FIXED' }],
    penaltyRate: 0,
    gracePeriodDays: 0,
    internalCode: '',
    notes: '',
    personInChargeId: '',
    status: 'DRAFT',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewSchedule, setPreviewSchedule] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    updatePreview();
  }, [formData.principal, formData.termMonths, formData.interestMethod, formData.interestRates, formData.issueDate]);

  const fetchData = async () => {
    if (!id) return;
    setIsLoadingData(true);
    try {
      const [debtRes, partiesRes, usersRes] = await Promise.all([
        enterpriseAuthAPI.getDebt(id),
        enterpriseAuthAPI.getParties({}),
        enterpriseAuthAPI.getUsers(),
      ]);

      if (partiesRes.data.success) setParties(partiesRes.data.data);
      if (usersRes.data.success) setInternalUsers(usersRes.data.data);

      if (debtRes.data.success) {
        const debt = debtRes.data.data;

        // Determine interest rate type based on first rate
        const firstRate = debt.interestRates?.[0];
        let type: InterestRateType = 'FIXED';
        if (firstRate?.rateType === 'FLOATING') type = 'FLOATING';
        if (firstRate?.rateType === 'REFERENCE') type = 'REFERENCE';
        setInterestRateType(type);

        setFormData({
          type: debt.type,
          partyId: debt.partyId,
          guarantorId: debt.guarantorId || '',
          origin: debt.origin,
          principal: debt.principal,
          interestMethod: debt.interestMethod,
          issueDate: new Date(debt.issueDate).toISOString().split('T')[0],
          termMonths:
            Math.round(
              (new Date(debt.dueDate).getTime() - new Date(debt.issueDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44),
            ) || 1,
          interestRates: debt.interestRates.map((r: any) => ({
            rate: r.rate,
            effectiveDate: new Date(r.effectiveDate).toISOString().split('T')[0],
            rateType: r.rateType,
            referenceBase: r.referenceBase || '',
            spread: r.spread || 0,
          })),
          penaltyRate: debt.penaltyRate,
          gracePeriodDays: debt.gracePeriodDays,
          internalCode: debt.internalCode,
          notes: debt.notes || '',
          personInChargeId: debt.personInChargeId || '',
          status: debt.status,
        });
      }
    } catch (err) {
      toast.error('Không thể tải dữ liệu khoản nợ');
      navigate('/debts');
    } finally {
      setIsLoadingData(false);
    }
  };

  const updatePreview = () => {
    if (formData.principal <= 0 || formData.termMonths <= 0) {
      setPreviewSchedule([]);
      return;
    }

    try {
      const schedule = generateSchedule({
        principal: formData.principal,
        issueDate: new Date(formData.issueDate),
        termMonths: formData.termMonths,
        interestMethod: formData.interestMethod,
        interestRates: formData.interestRates.map((r: any) => ({
          rate: Number(r.rate),
          effectiveDate: new Date(r.effectiveDate),
        })),
      });
      setPreviewSchedule(schedule);
    } catch (err) {
      console.error('Preview generation error:', err);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.partyId) newErrors.partyId = 'Vui lòng chọn đối tác';
    if (!formData.principal || formData.principal <= 0) newErrors.principal = 'Số tiền gốc phải lớn hơn 0';
    if (!formData.termMonths || formData.termMonths <= 0) newErrors.termMonths = 'Thời hạn phải lớn hơn 0';
    if (!formData.internalCode?.trim()) newErrors.internalCode = 'Vui lòng nhập mã tham chiếu (Số HĐ)';
    if (!formData.personInChargeId) newErrors.personInChargeId = 'Vui lòng chọn người phụ trách';
    if (!formData.issueDate) newErrors.issueDate = 'Vui lòng chọn ngày phát sinh';

    if (formData.interestMethod !== 'NONE') {
      formData.interestRates.forEach((rate: any, idx: number) => {
        if (rate.rate < 0) {
          newErrors[`interestRate_${idx}`] = 'Lãi suất không được âm';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại các thông tin còn thiếu hoặc sai sót');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        guarantorId: formData.guarantorId || null,
        personInChargeId: formData.personInChargeId || null,
        unlocked: isUnlocked,
      };
      const res = await enterpriseAuthAPI.updateDebt(id!, payload);
      if (res.data.success) {
        toast.success('Đã cập nhật khoản nợ thành công');
        navigate(`/debts/${id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi cập nhật khoản nợ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterestRateChange = (index: number, field: string, value: any) => {
    const newRates = [...formData.interestRates];
    newRates[index][field] = value;
    setFormData({ ...formData, interestRates: newRates });

    const errorKey = `interestRate_${index}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const addInterestRate = () => {
    const today = new Date().toISOString().split('T')[0];
    const newBracket =
      interestRateType === 'REFERENCE'
        ? { rate: 0, effectiveDate: today, rateType: 'REFERENCE', referenceBase: '', spread: 0 }
        : interestRateType === 'MIXED'
          ? { rate: 0, effectiveDate: today, rateType: 'FIXED' }
          : { rate: 0, effectiveDate: today, rateType: interestRateType === 'FIXED' ? 'FIXED' : 'FLOATING' };
    setFormData({ ...formData, interestRates: [...formData.interestRates, newBracket] });
  };

  const removeInterestRate = (index: number) => {
    if (formData.interestRates.length === 1) return;
    const newRates = [...formData.interestRates];
    newRates.splice(index, 1);
    setFormData({ ...formData, interestRates: newRates });
  };

  const handleInterestRateTypeChange = (type: InterestRateType) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const canEditFinancial = formData.status === 'DRAFT' || isUnlocked;

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium">Đang tải dữ liệu hồ sơ nợ...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Khoản nợ</span>
            <ChevronRight size={12} />
            <span>Hồ sơ {formData.internalCode}</span>
            <ChevronRight size={12} />
            <span className="text-amber-500">Chỉnh sửa</span>
          </div>
          <h1 className="text-3xl font-black text-white">Chỉnh sửa Khoản nợ</h1>
          <p className="text-slate-400 text-sm mt-1">
            Cập nhật thông tin hồ sơ.{' '}
            {formData.status !== 'DRAFT' && 'Hồ sơ đã kích hoạt cần mở khóa để sửa thông tin tài chính.'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            appName="web-enterprise"
            className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700 transition-all cursor-pointer"
            onClick={() => navigate(`/debts/${id}`)}
          >
            Hủy bỏ
          </Button>
          <Button
            appName="web-enterprise"
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer"
            onClick={handleSubmit}
          >
            <Save size={18} /> {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column: Form ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Unlock Warning if not DRAFT */}
          {formData.status !== 'DRAFT' && (
            <div
              className={`p-6 rounded-3xl border transition-all flex items-center justify-between gap-6 ${isUnlocked ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900 border-slate-800'}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-2xl ${isUnlocked ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                >
                  {isUnlocked ? <Unlock size={24} /> : <Lock size={24} />}
                </div>
                <div>
                  <h3 className="text-white font-bold">
                    {isUnlocked ? 'Đã mở khóa điều khoản tài chính' : 'Điều khoản tài chính đang khóa'}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {isUnlocked
                      ? 'Cẩn thận! Thay đổi sẽ làm tính toán lại toàn bộ lịch trình thanh toán.'
                      : 'Hồ sơ đã kích hoạt. Cần mở khóa để thay đổi Số tiền, Lãi suất, Thời hạn.'}
                  </p>
                </div>
              </div>
              <Button
                appName="web-enterprise"
                onClick={() => setIsUnlocked(!isUnlocked)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isUnlocked ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-600/20'}`}
              >
                {isUnlocked ? 'Đóng lại' : 'Mở khóa sửa'}
              </Button>
            </div>
          )}

          {/* Section: Thông tin chung */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <FileText size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Thông tin chung</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Loại nghiệp vụ
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setFormData({ ...formData, type: 'RECEIVABLE' })}
                    className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${formData.type === 'RECEIVABLE' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Phải thu
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: 'PAYABLE' })}
                    className={`py-2 px-4 rounded-lg text-xs font-bold transition-all ${formData.type === 'PAYABLE' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Phải trả
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nguồn gốc</label>
                <select
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                >
                  <option value="TRADE">Thương mại (Hợp đồng)</option>
                  <option value="FINANCIAL">Tài chính (Vay/Nợ)</option>
                  <option value="TAX">Thuế & Ngân sách</option>
                  <option value="BOND">Trái phiếu</option>
                  <option value="INTERNAL">Nội bộ</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Đối tác</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <User size={16} />
                  </div>
                  <select
                    className={`w-full pl-12 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none appearance-none ${
                      errors.partyId ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'
                    }`}
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
                </div>
                {errors.partyId && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.partyId}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Mã tham chiếu (Số HĐ)
                </label>
                <Input
                  placeholder="VD: HĐ-2024-001"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-sm text-white ${
                    errors.internalCode ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'
                  }`}
                  value={formData.internalCode}
                  onChange={(e) => {
                    setFormData({ ...formData, internalCode: e.target.value });
                    if (errors.internalCode) setErrors({ ...errors, internalCode: '' });
                  }}
                />
                {errors.internalCode && (
                  <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.internalCode}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Bên bảo lãnh (Tùy chọn)
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <User size={16} />
                  </div>
                  <select
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none appearance-none"
                    value={formData.guarantorId}
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

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Người Phụ Trách Nợ
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <User size={16} />
                  </div>
                  <select
                    className={`w-full pl-12 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none appearance-none ${
                      errors.personInChargeId ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'
                    }`}
                    value={formData.personInChargeId}
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
                {errors.personInChargeId && (
                  <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.personInChargeId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Điều khoản tài chính */}
          <div
            className={`bg-slate-900/50 border rounded-3xl p-8 space-y-6 transition-all ${canEditFinancial ? 'border-slate-800' : 'border-slate-800/50 opacity-60 pointer-events-none'}`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <Calculator size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Điều khoản tài chính</h2>
              </div>
              {!canEditFinancial && (
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-lg text-slate-500 border border-slate-800">
                  <Lock size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Chế độ xem</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Số tiền gốc (VND)
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <DollarSign size={16} />
                  </div>
                  <Input
                    type="number"
                    readOnly={!canEditFinancial}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white font-mono ${
                      errors.principal ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'
                    }`}
                    value={formData.principal}
                    onChange={(e) => {
                      setFormData({ ...formData, principal: Number(e.target.value) });
                      if (errors.principal) setErrors({ ...errors, principal: '' });
                    }}
                  />
                </div>
                {errors.principal && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.principal}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Thời hạn (Tháng)
                </label>
                <Input
                  type="number"
                  readOnly={!canEditFinancial}
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-sm text-white ${
                    errors.termMonths ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'
                  }`}
                  value={formData.termMonths}
                  onChange={(e) => {
                    setFormData({ ...formData, termMonths: Number(e.target.value) });
                    if (errors.termMonths) setErrors({ ...errors, termMonths: '' });
                  }}
                />
                {errors.termMonths && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.termMonths}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Ngày phát sinh
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Calendar size={16} />
                  </div>
                  <Input
                    type="date"
                    readOnly={!canEditFinancial}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-950 border rounded-xl text-sm text-white ${
                      errors.issueDate ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'
                    }`}
                    value={formData.issueDate}
                    onChange={(e) => {
                      setFormData({ ...formData, issueDate: e.target.value });
                      if (errors.issueDate) setErrors({ ...errors, issueDate: '' });
                    }}
                  />
                </div>
                {errors.issueDate && <p className="text-[10px] font-bold text-rose-500 ml-1">{errors.issueDate}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Phương thức tính lãi
                </label>
                <select
                  disabled={!canEditFinancial}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none disabled:opacity-100"
                  value={formData.interestMethod}
                  onChange={(e) => setFormData({ ...formData, interestMethod: e.target.value as InterestMethod })}
                >
                  <option value="REDUCING_BALANCE">Dư nợ giảm dần</option>
                  <option value="EMI">Trả đều (EMI)</option>
                  <option value="BULLET">Bullet (Gốc cuối kỳ)</option>
                  <option value="NONE">Không tính lãi</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Tỷ lệ phạt (%/ngày)
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Info size={16} />
                  </div>
                  <Input
                    type="number"
                    step="0.0001"
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                    value={formData.penaltyRate}
                    onChange={(e) => setFormData({ ...formData, penaltyRate: Number(e.target.value) })}
                    placeholder="VD: 0.0003 cho 0.03%"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Grace Period (Ngày)
                </label>
                <Input
                  type="number"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  value={formData.gracePeriodDays}
                  onChange={(e) => setFormData({ ...formData, gracePeriodDays: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Interest Rate Section */}
            {formData.interestMethod !== 'NONE' && (
              <InterestRateSection
                interestRateType={interestRateType}
                interestRates={formData.interestRates}
                errors={errors}
                onTypeChange={handleInterestRateTypeChange}
                onAdd={addInterestRate}
                onRemove={removeInterestRate}
                onChange={handleInterestRateChange}
              />
            )}
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Ghi chú</label>
            <textarea
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white min-h-25 outline-none focus:border-emerald-500/50 transition-all"
              placeholder="Nhập ghi chú hoặc điều khoản bổ sung..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        {/* ── Right Column: Preview ── */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 sticky top-8">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                <Users size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Lịch trình {canEditFinancial ? 'Dự kiến' : 'Hiện tại'}</h2>
            </div>

            <SchedulePreview
              schedule={previewSchedule}
              principal={formData.principal}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
