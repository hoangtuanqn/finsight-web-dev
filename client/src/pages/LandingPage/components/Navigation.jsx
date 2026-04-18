import { Link } from 'react-router-dom';
import { ToggleMode } from '../../../components/layout/components/ToggleMode';
import { useDarkMode } from '../../../hooks/useDarkMode';
import { useAuth } from '../../../context/AuthContext';
import { GradientText } from './Shared';

export default function Navigation() {
  const { token } = useAuth();
  const [dark, setDark] = useDarkMode();
  const isLoggedIn = !!token;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 dark:bg-[#030712]/60 backdrop-blur-xl border-b border-white/60 dark:border-white/10 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-black text-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all">
            F
          </div>
          <span className="font-black text-2xl text-slate-900 dark:text-white tracking-tight">Fin<GradientText>Sight</GradientText></span>
        </Link>
        
        <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-700 dark:text-slate-300">
          <a href="#features" className="hover:text-cyan-500 transition-colors uppercase tracking-widest text-xs">Tính năng</a>
          <a href="#how-it-works" className="hover:text-cyan-500 transition-colors uppercase tracking-widest text-xs">Giao thức</a>
          <a href="#faq" className="hover:text-cyan-500 transition-colors uppercase tracking-widest text-xs">Hỗ trợ</a>
        </div>
        
        <div className="flex items-center gap-6">
          <ToggleMode dark={dark} setDark={setDark} />
          
          <div className="hidden sm:block h-6 w-[1px] bg-slate-300 dark:bg-white/10" />

          {isLoggedIn ? (
            <Link to="/home" className="relative group px-6 py-2.5 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 text-slate-900 dark:text-white text-sm font-bold rounded-xl backdrop-blur-md hover:bg-white/20 dark:hover:bg-white/10 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">Dashboard</span>
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hidden sm:block text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Đăng nhập</Link>
              <Link to="/register" className="relative group px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all overflow-hidden">
                <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">Kết nối App</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
