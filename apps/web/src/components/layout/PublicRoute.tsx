import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * PublicRoute - chỉ cho phép truy cập khi CHƯA đăng nhập.
 * Nếu đã có user → redirect về Dashboard.
 * Dùng cho: /login, /register
 */
export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth() as any;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="w-8 h-8 border-[3px] border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/home" replace />;

  return children;
}
