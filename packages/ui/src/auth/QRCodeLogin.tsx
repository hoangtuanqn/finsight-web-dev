import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

interface QRCodeLoginProps {
  onLoginSuccess: (data: any) => void;
  qrApi: {
    generate: () => Promise<any>;
    checkStatus: (token: string) => Promise<any>;
  };
  themeColor?: 'indigo' | 'emerald';
}

export const QRCodeLogin = ({ onLoginSuccess, qrApi, themeColor = 'indigo' }: QRCodeLoginProps) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [shouldPoll, setShouldPoll] = useState(false);
  const queryClient = useQueryClient();

  const colorClass = themeColor === 'emerald' ? 'emerald-500' : 'indigo-500';
  const bgGradient = themeColor === 'emerald' ? 'from-emerald-600 to-teal-500' : 'from-indigo-600 to-violet-500';

  const {
    data: qrData,
    refetch: refetchQR,
    isLoading: isGenerating,
    isError: isGenerateError,
  } = useQuery({
    queryKey: ['qr-generate'],
    queryFn: async () => {
      const res = await qrApi.generate();
      return res.data.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (qrData?.qrToken) {
      setShouldPoll(true);
      setTimeLeft(60);
      queryClient.removeQueries({ queryKey: ['qr-status'] });
    }
  }, [qrData, queryClient]);

  const { data: statusData } = useQuery({
    queryKey: ['qr-status', qrData?.qrToken],
    queryFn: async () => {
      if (!qrData?.qrToken) return null;
      const res = await qrApi.checkStatus(qrData.qrToken);
      return res.data.data;
    },
    enabled: shouldPoll && !!qrData?.qrToken,
    refetchInterval: shouldPoll ? 2000 : false,
    refetchIntervalInBackground: true,
  });

  const currentStatus = statusData?.status || 'pending';

  useEffect(() => {
    if (currentStatus === 'approved') {
      setShouldPoll(false);
      onLoginSuccess(statusData);
    } else if (currentStatus === 'expired' || currentStatus === 'error' || currentStatus === 'rejected') {
      setShouldPoll(false);
    }
  }, [currentStatus, statusData, onLoginSuccess]);

  useEffect(() => {
    if (!shouldPoll || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShouldPoll(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [shouldPoll, timeLeft]);

  const handleRefresh = () => {
    refetchQR();
  };

  const isExpired = timeLeft === 0 || currentStatus === 'expired';
  const isRejected = currentStatus === 'rejected';
  const qrConfirmUrl = qrData?.qrToken ? `${window.location.origin}/qr-confirm?token=${qrData.qrToken}` : '';

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <Loader2 className={`w-10 h-10 text-${colorClass} animate-spin`} />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang tạo mã QR...</p>
          </motion.div>
        ) : isGenerateError || isExpired || isRejected ? (
          <motion.div
            key="expired"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <div className="relative w-48 h-48 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/10">
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl z-10 p-6 text-center">
                <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-white mb-4">
                  {isRejected ? 'Yêu cầu bị từ chối' : 'Mã QR đã hết hạn'}
                </p>
                <button
                  onClick={handleRefresh}
                  className={`flex items-center gap-2 px-4 py-2 bg-${colorClass} text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg`}
                >
                  <RefreshCw size={12} /> Làm mới
                </button>
              </div>
              <div className="opacity-10 grayscale">
                <QRCodeSVG value="expired" size={140} />
              </div>
            </div>
          </motion.div>
        ) : currentStatus === 'approved' ? (
          <motion.div
            key="approved"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-emerald-500">Đăng nhập thành công!</p>
            <p className="text-xs text-slate-500">Đang chuyển hướng...</p>
          </motion.div>
        ) : (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full"
          >
            <div className="relative group mb-6">
              <div
                className={`absolute -inset-1 bg-gradient-to-r ${bgGradient} rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-500`}
              />
              <div className="relative p-5 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                {currentStatus === 'scanned' ? (
                  <div className="w-48 h-48 flex flex-col items-center justify-center text-center gap-3">
                    <div className="relative">
                      <Smartphone className={`w-12 h-12 text-${colorClass} animate-bounce`} />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                        <CheckCircle size={10} className="text-white" />
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                      Đã kết nối thiết bị
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Vui lòng nhấn Xác nhận trên điện thoại của bạn
                    </p>
                  </div>
                ) : (
                  <QRCodeSVG
                    value={qrConfirmUrl}
                    size={192}
                    level="H"
                    includeMargin={false}
                    className="dark:bg-white p-2 rounded-xl"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <ShieldCheck size={14} className={`text-${colorClass}`} />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-nowrap">
                  Mã hiệu lực trong:{' '}
                  <span className={timeLeft < 10 ? 'text-red-500' : `text-${colorClass}`}>{timeLeft}s</span>
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center max-w-[240px] leading-relaxed">
                Dùng <span className={`font-black text-${colorClass}`}>Camera</span> hoặc{' '}
                <span className={`font-black text-${colorClass}`}>Zalo</span> quét mã để đăng nhập an toàn.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
