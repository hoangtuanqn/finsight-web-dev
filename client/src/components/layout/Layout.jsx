import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import MockMarketControl from '../common/MockMarketControl';

const SIDEBAR_WIDTH = 260;

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Sidebar fixed */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header fixed at top */}
        <Header sidebarWidth={SIDEBAR_WIDTH} />

        {/* Content area scrolling */}
        <main className="flex-1 overflow-y-auto pt-[60px]">
          <div className="p-8 max-w-[1280px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <MockMarketControl />
    </div>
  );
}
