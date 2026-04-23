import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { qrAPI } from '../../api';
import { RefreshCw, Smartphone, CheckCircle, AlertCircle, Loader2, ShieldCheck, X } from 'lucide-react';

export default function QRCodeLogin({ onLoginSuccess }) {
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, idle, scanned, approved, expired, error
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchQR = async () => {
    try {
      setStatus('loading');
      const res = await qrAPI.generate();
      setQrData(res.data.data);
      setStatus('idle');
      setTimeLeft(60);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  useEffect(() => {
    fetchQR();
  }, []);

  // Polling logic
  useEffect(() => {
    if (!qrData?.qrToken || status === 'approved' || status === 'expired' || status === 'error') return;

    const interval = setInterval(async () => {
      try {
        const res = await qrAPI.checkStatus(qrData.qrToken);
        const newStatus = res.data.data.status;

        if (newStatus === 'approved') {
          clearInterval(interval);
          setStatus('approved');
          onLoginSuccess(res.data.data);
        } else if (newStatus === 'scanned') {
          setStatus('scanned');
        } else if (newStatus === 'expired') {
          setStatus('expired');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [qrData, status, onLoginSuccess]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      if (status !== 'approved' && status !== 'error' && status !== 'loading') {
        setStatus('expired');
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, status]);

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <AnimatePresence mode="wait">
        {status === 'loading' ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang tạo mã QR...</p>
          </motion.div>
        ) : status === 'expired' ? (
          <motion.div key="expired" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-6">
            <div className="relative w-48 h-48 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/10">
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl z-10 p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-white mb-4">Mã QR đã hết hạn</p>
                  <button onClick={fetchQR} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all cursor-pointer">
                    <RefreshCw size={12} /> Làm mới
                  </button>
               </div>
               <div className="opacity-10 grayscale">
                 <QRCodeSVG value="expired" size={140} />
               </div>
            </div>
          </motion.div>
        ) : status === 'approved' ? (
          <motion.div key="approved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-emerald-500">Đăng nhập thành công!</p>
            <p className="text-xs text-slate-500">Đang chuyển hướng...</p>
          </motion.div>
        ) : (
          <motion.div key="qr" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center w-full">
            {/* QR Container */}
            <div className="relative group mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500" />
              <div className="relative p-5 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-xl">
                {status === 'scanned' ? (
                  <div className="w-48 h-48 flex flex-col items-center justify-center text-center gap-3">
                    <div className="relative">
                       <Smartphone className="w-12 h-12 text-blue-500 animate-bounce" />
                       <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                         <CheckCircle size={10} className="text-white" />
                       </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-tight">Đã quét thành công</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Vui lòng nhấn xác nhận trên điện thoại của bạn</p>
                  </div>
                ) : (
                  <QRCodeSVG
                    value={qrData?.qrImage ? qrData.qrImage : ''} // This is wrong, qrImage is base64. 
                    // Let's use the content instead
                    value={`finsight://qr-login?token=${qrData?.qrToken}`}
                    size={192}
                    level="H"
                    includeMargin={false}
                    className="dark:bg-white p-2 rounded-xl"
                  />
                )}
              </div>
            </div>

            {/* Status Footer */}
            <div className="flex flex-col items-center gap-3 w-full">
               <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                 <ShieldCheck size={14} className="text-blue-500" />
                 <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                   Mã hiệu lực trong: <span className={timeLeft < 10 ? 'text-red-500' : 'text-blue-500'}>{timeLeft}s</span>
                 </span>
               </div>
               
               <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center max-w-[240px] leading-relaxed">
                 Mở ứng dụng <span className="font-black text-blue-500">FinSight Mobile</span>, chọn "Quét mã" để đăng nhập an toàn.
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
