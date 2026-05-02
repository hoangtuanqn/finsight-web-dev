import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function SetSocialPasswordModal({
  tempToken,
  email,
  onComplete,
  onCancel,
}: {
  tempToken: string;
  email: string;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authAPI.setSocialPassword({ tempToken, password });
      const { user, token } = res.data.data;
      localStorage.setItem('finsight_token', token);
      setUser(user);
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={!loading ? onCancel : undefined}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-500">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Thiết lập mật khẩu</h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Bạn cần thiết lập mật khẩu cho tài khoản <strong>{email}</strong> để bảo vệ tài khoản và sử dụng các tính
            năng bảo mật.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Mật khẩu mới</label>
            <div className="relative group/input">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f8fafc] dark:bg-slate-800/80 border border-transparent focus:border-emerald-500/50 rounded-xl pl-10 pr-10 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white"
                placeholder="Tối thiểu 6 ký tự"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Xác nhận mật khẩu</label>
            <div className="relative group/input">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#f8fafc] dark:bg-slate-800/80 border border-transparent focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white"
                placeholder="Nhập lại mật khẩu"
              />
            </div>
          </div>

          {error && <p className="text-[11px] text-rose-500 font-bold text-center mt-2">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[12px] font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white text-[12px] font-bold transition-all shadow-lg flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Xác nhận'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
