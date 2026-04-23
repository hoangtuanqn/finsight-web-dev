import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { qrAPI } from '../api';
import { motion } from 'framer-motion';
import { Monitor, CheckCircle, XCircle, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function QRConfirmPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // loading, scanned, approved, rejected, error
  const [deviceInfo, setDeviceInfo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const markScanned = async () => {
      try {
        const res = await qrAPI.markScanned({ qrToken: token });
        setDeviceInfo(res.data.data.deviceInfo);
        setStatus('scanned');
      } catch (err) {
        console.error('Lỗi khi quét QR:', err);
        setStatus('error');
        toast.error(err.response?.data?.error || 'Mã QR không hợp lệ hoặc đã hết hạn');
      }
    };

    markScanned();
  }, [token]);

  const handleConfirm = async (action) => {
    if (!token || isProcessing) return;
    setIsProcessing(true);
    
    try {
      await qrAPI.confirm({ qrToken: token, action });
      if (action === 'approve') {
        setStatus('approved');
        toast.success('Đăng nhập thành công trên thiết bị mới!');
        setTimeout(() => navigate('/home'), 1500); // Tự động chuyển trang sau 1.5s
      } else {
        setStatus('rejected');
        toast.info('Đã từ chối yêu cầu đăng nhập.');
        setTimeout(() => navigate('/home'), 1500); // Tự động chuyển trang sau 1.5s
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại');
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    // Should not reach here if protected by layout, but just in case
    return null;
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl p-8 relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Đang kết nối...</h2>
              <p className="text-slate-500 text-sm">Vui lòng đợi trong giây lát</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Phiên bản không hợp lệ</h2>
              <p className="text-slate-500 text-sm mb-6">Mã QR có thể đã hết hạn hoặc được sử dụng.</p>
              <button 
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft size={18} /> Về trang chủ
              </button>
            </div>
          )}

          {status === 'scanned' && (
            <div className="flex flex-col items-center gap-4 w-full py-4">
              <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 relative">
                <Monitor className="w-10 h-10 text-blue-500" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <ShieldAlert size={12} className="text-white" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Xác nhận đăng nhập</h2>
              
              <div className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 my-4 text-left">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tài khoản</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{user.email}</p>
                  </div>
                  <div className="h-px w-full bg-slate-200 dark:bg-white/10" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thiết bị yêu cầu</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{deviceInfo || 'Trình duyệt Web Desktop'}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center mb-6">
                Xác nhận nếu bạn đang cố gắng đăng nhập FinSight trên thiết bị này.
              </p>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => handleConfirm('approve')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle size={20} />}
                  Cho phép đăng nhập
                </button>
                <button
                  onClick={() => handleConfirm('reject')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold rounded-xl transition-all disabled:opacity-70"
                >
                  <XCircle size={20} className="text-red-500" />
                  Từ chối
                </button>
              </div>
            </div>
          )}

          {status === 'approved' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 relative">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 border-2 border-emerald-500 rounded-full"
                />
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Thành công!</h2>
              <p className="text-slate-500 text-sm mb-6 text-center">
                Thiết bị đã được đăng nhập thành công. Bạn có thể tiếp tục sử dụng máy tính.
              </p>
              <button 
                onClick={() => navigate('/home')}
                className="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Về trang chủ
              </button>
            </div>
          )}

          {status === 'rejected' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-2">
                <XCircle className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Đã hủy yêu cầu</h2>
              <p className="text-slate-500 text-sm mb-6">Bạn đã từ chối quyền đăng nhập cho thiết bị này.</p>
              <button 
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft size={18} /> Về trang chủ
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
