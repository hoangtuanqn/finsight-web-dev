import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard', end: true },
  { to: '/debts', icon: '💳', label: 'Quản lý nợ' },
  { to: '/debts/ear-analysis', icon: '🔍', label: 'Phân tích EAR' },
  { to: '/debts/repayment', icon: '📋', label: 'Kế hoạch trả nợ' },
  { to: '/investment', icon: '📈', label: 'Đầu tư' },
  { to: '/risk-assessment', icon: '🎯', label: 'Đánh giá rủi ro' },
  { to: '/profile', icon: '👤', label: 'Hồ sơ' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-[260px] h-screen sticky top-0 bg-[#0d1321]/90 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="p-5 pb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white text-sm font-bold">F</span>
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-gradient">FinSight</h1>
            <p className="text-[10px] text-slate-600 -mt-0.5">AI Financial Advisor</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/[0.06] mx-4 shrink-0" />

      {/* Nav - Scrollable if too many items */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-500/12 text-blue-400'
                  : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User - Fixed at bottom */}
      <div className="p-4 border-t border-white/[0.06] shrink-0 bg-[#0d1321]/40 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-semibold text-white shadow-lg shadow-blue-500/20">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-200">{user?.fullName || 'User'}</p>
            <p className="text-[11px] text-slate-600 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-slate-600 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <span>🚪</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </motion.aside>
  );
}
