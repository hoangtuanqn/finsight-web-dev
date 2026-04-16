import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import MockMarketControl from '../common/MockMarketControl';
import AIChatbotModal from '../chat/AIChatbotModal';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Layout() {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  // Desktop: collapsed state. Mobile: drawer open state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = isMobile ? 0 : isCollapsed ? 80 : 260;

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

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

  if (!user) return <Navigate to="/" />;

  const toggleSidebar = () => {
    if (isMobile) setMobileOpen(v => !v);
    else setIsCollapsed(v => !v);
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>

      {/* Mobile overlay backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile
            ? `fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'relative'
          }
        `}
      >
        <Sidebar
          isCollapsed={!isMobile && isCollapsed}
          width={isMobile ? 260 : isCollapsed ? 80 : 260}
          onClose={() => setMobileOpen(false)}
          isMobile={isMobile}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300">
        <Header
          sidebarWidth={sidebarWidth}
          isCollapsed={isMobile ? false : isCollapsed}
          setIsCollapsed={toggleSidebar}
          isMobile={isMobile}
        />

        {/* Content area scrolling */}
        <main className="flex-1 overflow-y-auto pt-[89px]">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <MockMarketControl />
      <AIChatbotModal />
    </div>
  );
}
