import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Fingerprint, ScanFace, Shield, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authAPI, faceAPI } from '../../../api';
import OTPInput from '../../../components/auth/OTPInput';
import { FaceCamera } from '../../../components/face/FaceCamera';

interface SecuritySectionProps {
  user: {
    id: string;
    isTwoFactorEnabled: boolean;
  };
  onUpdate: () => void;
}

export default function SecuritySection({ user, onUpdate }: SecuritySectionProps) {
  // ── 2FA state ────────────────────────────────────────────────
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupData, setSetupData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [step, setStep] = useState<'info' | 'qr' | 'verify' | 'backup'>('info');
  const [loading, setLoading] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  // ── Face Login state ─────────────────────────────────────────
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [faceLoading, setFaceLoading] = useState(true);
  const [showFaceRegister, setShowFaceRegister] = useState(false);
  const [showFaceRemove, setShowFaceRemove] = useState(false);
  const [faceRemoving, setFaceRemoving] = useState(false);
  const [faceRemovePassword, setFaceRemovePassword] = useState('');
  const [faceRemoveError, setFaceRemoveError] = useState('');

  // Load face status on mount
  useEffect(() => {
    faceAPI
      .getStatus()
      .then((res) => setFaceRegistered(res.data.data.hasRegistered))
      .catch(() => setFaceRegistered(false))
      .finally(() => setFaceLoading(false));
  }, []);

  // ── 2FA handlers ─────────────────────────────────────────────
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

  // ── Face handlers ─────────────────────────────────────────────
  const handleFaceDescriptor = async (descriptor: number[]) => {
    try {
      await faceAPI.register(descriptor);
      setFaceRegistered(true);
      setShowFaceRegister(false);
      toast.success('Đã đăng ký khuôn mặt thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Không thể đăng ký khuôn mặt');
    }
  };

  const handleRemoveFace = async () => {
    if (!faceRemovePassword) {
      setFaceRemoveError('Vui lòng nhập mật khẩu');
      return;
    }
    setFaceRemoving(true);
    setFaceRemoveError('');
    try {
      await authAPI.verifyPassword({ password: faceRemovePassword });
      await faceAPI.remove();
      setFaceRegistered(false);
      setShowFaceRemove(false);
      setFaceRemovePassword('');
      toast.success('Đã xóa đăng ký khuôn mặt');
    } catch (err: any) {
      setFaceRemoveError(err.response?.data?.error || 'Mật khẩu không chính xác');
    } finally {
      setFaceRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 2FA Card ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${
              user?.isTwoFactorEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
            }`}
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
          disabled={loading}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            user?.isTwoFactorEnabled
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
          }`}
        >
          {user?.isTwoFactorEnabled ? 'Tắt bảo mật' : 'Kích hoạt ngay'}
        </button>
      </div>

      {/* ── Face Login Card ────────────────────────────────────── */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${
              faceRegistered
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
            }`}
          >
            {faceRegistered ? <ScanFace size={24} /> : <Fingerprint size={24} />}
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Đăng nhập bằng khuôn mặt</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {faceLoading
                ? 'Đang kiểm tra...'
                : faceRegistered
                  ? 'Khuôn mặt đã được đăng ký. Bạn có thể đăng nhập nhanh.'
                  : 'Đăng ký khuôn mặt để đăng nhập không cần mật khẩu.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {faceRegistered && (
            <button
              onClick={() => setShowFaceRemove(true)}
              className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
              title="Xóa đăng ký khuôn mặt"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => setShowFaceRegister(true)}
            disabled={faceLoading}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              faceRegistered
                ? 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
            }`}
          >
            {faceRegistered ? 'Cập nhật' : 'Đăng ký ngay'}
          </button>
        </div>
      </div>

      {/* ── 2FA Modal ─────────────────────────────────────────── */}
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

      {/* ── Face Register Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showFaceRegister && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFaceRegister(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                  <ScanFace size={28} />
                </div>
                <h2 className="text-xl font-black text-white">
                  {faceRegistered ? 'Cập nhật khuôn mặt' : 'Đăng ký khuôn mặt'}
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Nhìn thẳng vào camera. Đảm bảo ánh sáng tốt và không đeo kính.
                </p>
              </div>

              <FaceCamera
                mode="register"
                onDescriptor={handleFaceDescriptor}
                onCancel={() => setShowFaceRegister(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Face Remove Confirm Modal ──────────────────────────── */}
      <AnimatePresence>
        {showFaceRemove && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !faceRemoving && setShowFaceRemove(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden text-center space-y-6"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-orange-400" />

              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                <Trash2 size={28} />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">Xóa đăng ký khuôn mặt?</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Để bảo mật, vui lòng nhập mật khẩu tài khoản để xác nhận thao tác này.
                </p>
              </div>

              <div className="space-y-2 text-left">
                <input
                  type="password"
                  value={faceRemovePassword}
                  onChange={(e) => setFaceRemovePassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className="w-full bg-[#f8fafc] dark:bg-slate-800/80 border border-transparent focus:border-rose-500/50 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-rose-500/10 outline-none transition-all dark:text-white"
                />
                {faceRemoveError && <p className="text-[10px] text-rose-500 font-bold">{faceRemoveError}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFaceRemove(false);
                    setFaceRemoveError('');
                    setFaceRemovePassword('');
                  }}
                  disabled={faceRemoving}
                  className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-[11px] font-black uppercase tracking-wider hover:bg-white/10 transition-all"
                >
                  Hủy
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleRemoveFace}
                  disabled={faceRemoving}
                  className="flex-1 py-3 rounded-2xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-rose-500 transition-all flex items-center justify-center gap-2"
                >
                  {faceRemoving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={14} /> Xóa ngay
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
