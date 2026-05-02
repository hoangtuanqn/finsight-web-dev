import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { authAPI } from '../../../api';
import OTPInput from '../../../components/auth/OTPInput';

interface SecuritySectionProps {
  user: {
    id: string;
    isTwoFactorEnabled: boolean;
  };
  onUpdate: () => void;
}

export default function SecuritySection({ user, onUpdate }: SecuritySectionProps) {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupData, setSetupData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [step, setStep] = useState<'info' | 'qr' | 'verify' | 'backup'>('info');
  const [loading, setLoading] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const res = await authAPI.setup2FA();
      setSetupData(res.data.data);
      setStep('qr');
      setIsSettingUp(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Không thể khởi tạo thiết lập 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEnable = async (otpCode: string) => {
    setLoading(true);
    try {
      const res = await authAPI.enable2FA({ token: otpCode });
      setBackupCodes(res.data.data.backupCodes);
      setStep('backup');
      toast.success('Kích hoạt 2FA thành công!');
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Mã xác thực không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (otpCode: string) => {
    setLoading(true);
    try {
      await authAPI.disable2FA({ token: otpCode });
      toast.success('Đã tắt bảo mật 2FA');
      setIsDisabling(false);
      onUpdate();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Mã xác thực không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào bộ nhớ tạm');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${user?.isTwoFactorEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-slate-500/10 border-slate-500/30 text-slate-400'}`}
          >
            {user?.isTwoFactorEnabled ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Xác thực 2 yếu tố (2FA)</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {user?.isTwoFactorEnabled
                ? 'Tài khoản đang được bảo mật tối đa.'
                : 'Nâng cao bảo mật cho tài khoản của bạn.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => (user?.isTwoFactorEnabled ? setIsDisabling(true) : handleStartSetup())}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${user?.isTwoFactorEnabled ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'}`}
        >
          {user?.isTwoFactorEnabled ? 'Tắt bảo mật' : 'Kích hoạt ngay'}
        </button>
      </div>

      {/* Setup Wizard Modal */}
      <AnimatePresence>
        {(isSettingUp || isDisabling) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!loading) {
                  setIsSettingUp(false);
                  setIsDisabling(false);
                }
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />

              {isDisabling ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-500">
                      <Shield size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white">Xác nhận tắt 2FA</h2>
                    <p className="text-sm text-slate-400 mt-2">
                      Nhập mã OTP từ ứng dụng của bạn để xác nhận yêu cầu này.
                    </p>
                  </div>

                  <OTPInput onComplete={handleDisable2FA} />

                  <button
                    onClick={() => setIsDisabling(false)}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                  >
                    Hủy bỏ
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {step === 'qr' && setupData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-black text-white">Quét mã QR</h2>
                        <p className="text-sm text-slate-400 mt-2">
                          Sử dụng Google Authenticator hoặc Authy để quét mã này.
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-3xl mx-auto w-48 h-48 flex items-center justify-center">
                        <img src={setupData.qrCode} alt="QR Code" className="w-full h-full" />
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                          Hoặc nhập mã thủ công
                        </p>
                        <div className="flex items-center justify-between">
                          <code className="text-indigo-400 font-mono font-bold tracking-wider">{setupData.secret}</code>
                          <button
                            onClick={() => copyToClipboard(setupData.secret)}
                            className="text-slate-500 hover:text-white transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setStep('verify')}
                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[11px] hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                      >
                        Tiếp tục
                      </button>
                    </motion.div>
                  )}

                  {step === 'verify' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-black text-white">Xác thực mã OTP</h2>
                        <p className="text-sm text-slate-400 mt-2">
                          Nhập mã 6 chữ số vừa xuất hiện trong ứng dụng của bạn.
                        </p>
                      </div>

                      <OTPInput onComplete={handleVerifyEnable} />

                      <button
                        onClick={() => setStep('qr')}
                        className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                      >
                        Quay lại mã QR
                      </button>
                    </motion.div>
                  )}

                  {step === 'backup' && backupCodes && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-500">
                          <Check size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-white">Lưu mã dự phòng</h2>
                        <p className="text-sm text-slate-400 mt-2">
                          Hãy lưu các mã này ở nơi an toàn. Mỗi mã chỉ sử dụng được 1 lần.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-6 rounded-3xl bg-white/5 border border-white/10 max-h-60 overflow-y-auto">
                        {backupCodes.map((code, idx) => (
                          <div key={idx} className="flex items-center gap-3 py-1.5">
                            <span className="text-[10px] font-black text-slate-500">{idx + 1}.</span>
                            <code className="text-sm font-bold text-white tracking-widest">{code}</code>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => copyToClipboard(backupCodes.join('\n'))}
                          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                        >
                          <Copy size={16} /> Sao chép
                        </button>
                        <button
                          onClick={() => {
                            setIsSettingUp(false);
                            setStep('info');
                          }}
                          className="flex-1 py-3.5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-[11px] hover:bg-indigo-500 transition-all"
                        >
                          Hoàn tất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
