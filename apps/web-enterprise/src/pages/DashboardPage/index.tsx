import { motion } from 'framer-motion';
import { Building2, FileText, Sparkles, Users } from 'lucide-react';
import { ToggleMode } from '../../components/layout/components/ToggleMode';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';

export default function DashboardPage() {
  const { user } = useAuth() as any;
  const [dark, setDark] = useDarkMode() as [boolean, (val: boolean) => void];

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 pt-4 pb-2">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-5">
              <Sparkles size={12} />
              Enterprise Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-[1.1]">
              Chào mừng,{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
                {user?.fullName || 'bạn'}
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
              Bạn đang đăng nhập với tư cách: {user?.roleTitle || 'Người dùng doanh nghiệp'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ToggleMode dark={dark} setDark={setDark} />
          </div>
        </div>
      </motion.div>

      {/* ── Simple Quick Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm"
        >
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">Tổng đối tác</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">0</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm"
        >
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
            <FileText size={24} />
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">Hợp đồng đang chạy</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">0</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm"
        >
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center mb-4">
            <Building2 size={24} />
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">Chi nhánh</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">1</p>
        </motion.div>
      </div>
    </div>
  );
}
