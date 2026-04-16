import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export function ProtectedRoute({ children, isAdmin = false }: ProtectedRouteProps) {
  const { isLoading } = useAuth();
  const location = useLocation();

  // Admin 使用 admin_access_token 检查认证
  const adminToken = isAdmin ? !!localStorage.getItem('admin_access_token') : false;
  // 非 admin 使用 access_token（业务端）
  const businessToken = !isAdmin ? !!localStorage.getItem('access_token') : false;
  const isAuthenticated = adminToken || businessToken;

  if (isLoading && !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
