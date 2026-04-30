import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, ArrowRight, ShieldAlert, CheckCircle2, Monitor, Sparkles, Shield, Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../api';
import { toast } from 'sonner';

export default function TwoFactorBanner({ user }: { user: any }) {
  const [state, setState] = useState<'NONE' | 'PROMPT_TRUST' | 'TRUSTED' | 'HIDDEN'>('HIDDEN');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('dismiss_2fa_banner');
    const hasTrustToken = localStorage.getItem('finsight_trust_token');

    if (!user?.isTwoFactorEnabled) {
      if (!isDismissed) setState('NONE');
    } else if (hasTrustToken) {
      const isTrustedDismissed = localStorage.getItem('dismiss_trusted_banner');
      if (!isTrustedDismissed) setState('TRUSTED');
    } else {
      const isPromptDismissed = localStorage.getItem('dismiss_trust_prompt');
      if (!isPromptDismissed) setState('PROMPT_TRUST');
    }
  }, [user]);

  const handleTrustDevice = async () => {
    setLoading(true);
    try {
      const res = await authAPI.trustDevice();
      const { trustToken } = res.data.data;
      localStorage.setItem('finsight_trust_token', trustToken);
      setState('TRUSTED');
      toast.success('Thiết bị này hiện đã được tin cậy!');
    } catch (err: any) {
      toast.error('Lỗi xác thực thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (state === 'NONE') localStorage.setItem('dismiss_2fa_banner', 'true');
    else if (state === 'PROMPT_TRUST') localStorage.setItem('dismiss_trust_prompt', 'true');
    else localStorage.setItem('dismiss_trusted_banner', 'true');
    setState('HIDDEN');
  };

  if (state === 'HIDDEN') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -10 }}
        className="relative z-40 mb-8"
      >
        {state === 'NONE' ? (
          // ── Cảnh báo chưa bật 2FA (Gọn gàng hơn) ──
          <div className="relative group overflow-hidden rounded-[2rem] p-[1px] bg-gradient-to-r from-rose-500/30 via-purple-500/30 to-indigo-500/30 shadow-lg shadow-rose-500/5">
             <div className="relative bg-slate-900/90 backdrop-blur-2xl rounded-[1.95rem] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                      <ShieldAlert size={20} />
                   </div>
                   <div>
                      <h4 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                         Bảo mật AI chưa kích hoạt <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">Bật 2FA ngay để bảo vệ tài sản của bạn trước các rủi ro bảo mật.</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <Link to="/profile" className="px-5 py-2.5 rounded-xl bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center gap-2 group">
                      Thiết lập ngay <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                   </Link>
                   <button onClick={handleDismiss} className="p-2.5 rounded-xl text-slate-500 hover:text-white transition-all"><X size={18} /></button>
                </div>
             </div>
          </div>
        ) : state === 'PROMPT_TRUST' ? (
          // ── Prompt Trust Device (Premium Glow Style) ──
          <div className="relative group overflow-hidden rounded-[2rem] p-[1px] bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-blue-500/40 shadow-xl shadow-indigo-500/10">
             <div className="relative bg-slate-950/90 backdrop-blur-3xl rounded-[1.95rem] px-8 py-5 overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 blur-[100px]" />
                
                <div className="flex flex-col lg:flex-row items-center gap-6 relative z-10">
                   <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                         <Monitor size={24} />
                      </div>
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-950">
                         <ShieldCheck size={10} className="text-white" strokeWidth={3} />
                      </div>
                   </div>

                   <div className="flex-1 text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-2">
                         <Sparkles size={10} /> Device Recognition
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight">Đăng ký thiết bị uy tín?</h3>
                      <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-lg">FinSight nhận diện đây là trình duyệt an toàn. Bạn có muốn bỏ qua 2FA tại đây không?</p>
                   </div>

                   <div className="flex items-center gap-3 shrink-0">
                      <button 
                         onClick={handleTrustDevice}
                         disabled={loading}
                         className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.1em] hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2 active:scale-95"
                      >
                         {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={16} />}
                         Tin cậy thiết bị
                      </button>
                      <button onClick={handleDismiss} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Lúc khác</button>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          // ── Trusted Status (Siêu gọn) ──
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 backdrop-blur-md">
             <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Thiết bị uy tín</span>
             </div>
             <div className="w-px h-3 bg-emerald-500/20" />
             <span className="text-[9px] text-slate-500 font-bold uppercase">{navigator.userAgent.split(' ')[0]}</span>
             <button onClick={handleDismiss} className="ml-2 p-1 text-slate-500 hover:text-white transition-all"><X size={12} /></button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
