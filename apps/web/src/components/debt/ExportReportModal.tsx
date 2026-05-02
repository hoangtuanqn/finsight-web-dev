import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  FileDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { reportAPI } from '../../api';
import { useDebts } from '../../hooks/useDebtQuery';

const ExportReportModal = ({ isOpen, onClose }) => {
  const [loadingType, setLoadingType] = useState(null);
  const [success, setSuccess] = useState(false);
  const [timeRange, setTimeRange] = useState('all');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [selectedDebts, setSelectedDebts] = useState(['all']);

  const { data: debtData } = useDebts() as any;
  const debts = debtData?.debts || [];

  const toggleDebt = (id) => {
    if (id === 'all') {
      setSelectedDebts(['all']);
    } else {
      let next = selectedDebts.filter((d) => d !== 'all');
      if (next.includes(id)) {
        next = next.filter((d) => d !== id);
      } else {
        next.push(id);
      }
      if (next.length === 0) next = ['all'];
      setSelectedDebts(next);
    }
  };

  const handleExport = async (format) => {
    setLoadingType(format);
    try {
      const debtIdParam = selectedDebts.includes('all') ? 'all' : selectedDebts.join(',');

      const response = await reportAPI.exportReport({
        format,
        timeRange,
        debtId: debtIdParam,
        startDate: timeRange === 'custom' ? customDates.start : undefined,
        endDate: timeRange === 'custom' ? customDates.end : undefined,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      link.setAttribute('download', `FinSight_Report_${new Date().getTime()}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Xuất báo cáo thất bại. Vui lòng kiểm tra lại bộ lọc hoặc thử lại sau.');
    } finally {
      setLoadingType(null);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            style={{ width: '100vw', height: '100vh' }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-[10000]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileDown className="w-6 h-6 text-blue-400" />
                  Xuất Báo Cáo Chuyên Sâu
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {!success && (
                <div className="space-y-6">
                  {/* Time Range Section */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} /> Khoảng thời gian
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'this_month', label: 'Tháng này' },
                        { id: '3m', label: '3 tháng qua' },
                        { id: '6m', label: '6 tháng qua' },
                        { id: 'custom', label: 'Tùy chọn' },
                        { id: 'all', label: 'Tất cả' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setTimeRange(opt.id)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                            timeRange === opt.id
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {timeRange === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 gap-3 p-4 bg-slate-800/30 rounded-2xl border border-slate-800"
                      >
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 uppercase font-bold">Từ ngày</label>
                          <input
                            type="date"
                            value={customDates.start}
                            onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 uppercase font-bold">Đến ngày</label>
                          <input
                            type="date"
                            value={customDates.end}
                            onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Debt Selection Section */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={14} /> Chọn khoản nợ (Có thể chọn nhiều)
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      <button
                        onClick={() => toggleDebt('all')}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedDebts.includes('all')
                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-sm font-medium">Tất cả khoản nợ</span>
                        {selectedDebts.includes('all') && <CheckCircle2 size={16} />}
                      </button>
                      {debts.map((d: any) => (
                        <button
                          key={d.id}
                          onClick={() => toggleDebt(d.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                            selectedDebts.includes(d.id)
                              ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400'
                              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <div className="text-left">
                            <div className="text-sm font-medium">{d.name}</div>
                            <div className="text-[10px] opacity-60">{d.platform}</div>
                          </div>
                          {selectedDebts.includes(d.id) && <CheckCircle2 size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-800" />

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      disabled={loadingType !== null}
                      onClick={() => handleExport('pdf')}
                      className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-2xl transition-all group disabled:opacity-50"
                    >
                      <FileText className="w-6 h-6 text-red-400" />
                      <span className="text-sm font-semibold text-white">Xuất PDF</span>
                      {loadingType === 'pdf' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                    </button>

                    <button
                      disabled={loadingType !== null}
                      onClick={() => handleExport('excel')}
                      className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-2xl transition-all group disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                      <span className="text-sm font-semibold text-white">Xuất Excel</span>
                      {loadingType === 'excel' && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
                    </button>
                  </div>
                </div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Báo cáo đã sẵn sàng!</h4>
                  <p className="text-slate-400 text-sm mt-2 max-w-[240px]">
                    Tệp tin đã được tải xuống thiết bị của bạn thành công.
                  </p>
                </motion.div>
              )}
            </div>

            <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Dữ liệu báo cáo được tổng hợp dựa trên các khoản nợ bạn đã chọn. FinSight cam kết bảo mật thông tin tài
                chính của bạn theo tiêu chuẩn quốc tế.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default ExportReportModal;
