import { generateSchedule, type InterestMethod } from '@repo/financial-core';
import { Button, Input } from '@repo/ui';
import { motion } from 'framer-motion';
import { Calculator, Calendar, ChevronRight, DollarSign, FileText, Info, Save, User, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../../api';
import { InterestRateSection } from '../../components/debts/InterestRateSection';
import { SchedulePreview } from '../../components/debts/SchedulePreview';

export default function DebtCreatePage() {
  const navigate = useNavigate();
  const [parties, setParties] = useState<any[]>([]);
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<any>({
    type: 'RECEIVABLE',
    partyId: '',
    guarantorId: '',
    origin: 'TRADE',
    principal: 0,
    interestMethod: 'REDUCING_BALANCE' as InterestMethod,
    issueDate: new Date().toISOString().split('T')[0],
    termMonths: 12,
    interestRates: [{ rate: 0, effectiveDate: new Date().toISOString().split('T')[0] }],
    penaltyRate: 0,
    gracePeriodDays: 0,
    internalCode: '',
    notes: '',
    personInChargeId: '',
  });

  const [previewSchedule, setPreviewSchedule] = useState<any[]>([]);

  useEffect(() => {
    fetchParties();
    fetchUsers();
  }, []);

  useEffect(() => {
    updatePreview();
  }, [formData.principal, formData.termMonths, formData.interestMethod, formData.interestRates, formData.issueDate]);

  const fetchParties = async () => {
    try {
      const res = await (enterpriseAuthAPI as any).getParties();
      if (res.data.success) {
        setParties(res.data.data);
      }
    } catch (err) {
      toast.error('Không thể tải danh sách đối tác');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await (enterpriseAuthAPI as any).getUsers();
      if (res.data.success) {
        setInternalUsers(res.data.data);
      }
    } catch (err) {
      // ignore
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyId) {
      toast.error('Vui lòng chọn đối tác');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        guarantorId: formData.guarantorId || null,
        personInChargeId: formData.personInChargeId || null,
      };
      const res = await (enterpriseAuthAPI as any).createDebt(payload);
      if (res.data.success) {
        toast.success('Đã tạo khoản nợ thành công');
        navigate('/debts');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi khi tạo khoản nợ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterestRateChange = (index: number, field: string, value: any) => {
    const newRates = [...formData.interestRates];
    newRates[index][field] = value;
    setFormData({ ...formData, interestRates: newRates });
  };

  const addInterestRate = () => {
    setFormData({
      ...formData,
      interestRates: [...formData.interestRates, { rate: 0, effectiveDate: new Date().toISOString().split('T')[0] }],
    });
  };

  const removeInterestRate = (index: number) => {
    if (formData.interestRates.length === 1) return;
    const newRates = [...formData.interestRates];
    newRates.splice(index, 1);
    setFormData({ ...formData, interestRates: newRates });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Khoản nợ</span>
            <ChevronRight size={12} />
            <span className="text-emerald-500">Tạo mới</span>
          </div>
          <h1 className="text-3xl font-black text-white">Ghi nhận Khoản nợ mới</h1>
          <p className="text-slate-400 text-sm mt-1">Khởi tạo hồ sơ nợ và tự động sinh lịch trình thanh toán.</p>
        </div>
        <div className="flex gap-3">
          <Button
            appName="web-enterprise"
            className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700 transition-all cursor-pointer"
            onClick={() => navigate('/debts')}
          >
            Hủy bỏ
          </Button>
          <Button
            appName="web-enterprise"
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer"
            onClick={handleSubmit}
          >
            <Save size={18} /> {isLoading ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column: Form ── */}
        <div className="lg:col-span-2 space-y-6">
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none appearance-none"
                    value={formData.partyId}
                    onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                  >
                    <option value="">Chọn đối tác...</option>
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
                  Mã tham chiếu (Số HĐ)
                </label>
                <Input
                  placeholder="VD: HĐ-2024-001"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  value={formData.internalCode}
                  onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                />
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none appearance-none"
                    value={formData.personInChargeId}
                    onChange={(e) => setFormData({ ...formData, personInChargeId: e.target.value })}
                  >
                    <option value="">Chọn nhân viên phụ trách...</option>
                    {internalUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.roleTitle || 'Nhân viên'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Điều khoản tài chính */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Calculator size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Điều khoản tài chính</h2>
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                    value={formData.principal}
                    onChange={(e) => setFormData({ ...formData, principal: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Thời hạn (Tháng)
                </label>
                <Input
                  type="number"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  value={formData.termMonths}
                  onChange={(e) => setFormData({ ...formData, termMonths: Number(e.target.value) })}
                />
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
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                  Phương thức tính lãi
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-emerald-500/50 transition-all outline-none"
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
                <p className="text-[10px] text-slate-500 ml-1">0.03% (0.0003) là mức phạt chuẩn theo luật VN.</p>
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

            {/* Floating Rates Section */}
            {formData.interestMethod !== 'NONE' && (
              <InterestRateSection
                interestRates={formData.interestRates}
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
              <h2 className="text-lg font-bold text-white">Lịch trình Dự kiến</h2>
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
