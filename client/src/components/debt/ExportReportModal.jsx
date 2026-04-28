import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileDown, 
  FileSpreadsheet, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { reportAPI } from '../../api';

const ExportReportModal = ({ isOpen, onClose }) => {
  const [loadingType, setLoadingType] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async (format) => {
    setLoadingType(format);
    try {
      const response = await reportAPI.exportReport(format);
      
      // Handle Blob download
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
      alert('Xuất báo cáo thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoadingType(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileDown className="w-6 h-6 text-blue-400" />
                Xuất Báo Cáo Nợ
              </h3>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Chọn định dạng báo cáo bạn muốn tải về để theo dõi sức khỏe tài chính.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                <h4 className="text-lg font-semibold text-white">Tải về thành công!</h4>
                <p className="text-slate-400 text-sm mt-1">Báo cáo của bạn đang được lưu trữ.</p>
              </motion.div>
            ) : (
              <>
                {/* PDF Option */}
                <button
                  disabled={loadingType !== null}
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Báo cáo PDF (Khuyên dùng)</div>
                    <div className="text-xs text-slate-400">Đầy đủ biểu đồ, phân tích rủi ro & lộ trình AI.</div>
                  </div>
                  {loadingType === 'pdf' ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" /> : <FileDown className="w-5 h-5 text-slate-500 group-hover:text-blue-400" />}
                </button>

                {/* Excel Option */}
                <button
                  disabled={loadingType !== null}
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">Bảng tính Excel</div>
                    <div className="text-xs text-slate-400">Dữ liệu chi tiết cho việc tính toán cá nhân.</div>
                  </div>
                  {loadingType === 'excel' ? <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /> : <FileDown className="w-5 h-5 text-slate-500 group-hover:text-emerald-400" />}
                </button>

                <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl mt-4">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="text-[10px] text-blue-300/70">
                    Báo cáo được mã hóa và bảo mật. Chỉ bạn mới có quyền truy cập vào dữ liệu này.
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExportReportModal;
