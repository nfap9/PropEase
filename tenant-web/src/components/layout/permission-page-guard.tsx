'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { MainLayout } from '@/components/layout/main-layout';

/**
 * 路由到权限的映射
 */
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/apartments': PERMISSIONS.APARTMENT_VIEW,
  '/rooms': PERMISSIONS.ROOM_VIEW,
  '/tenants': PERMISSIONS.TENANT_VIEW,
  '/leases': PERMISSIONS.LEASE_VIEW,
  '/utilities': PERMISSIONS.UTILITY_VIEW,
  '/bills': PERMISSIONS.BILL_VIEW,
  '/reports': PERMISSIONS.REPORT_VIEW,
  '/settings/team': PERMISSIONS.MEMBER_VIEW,
  '/settings/permissions': PERMISSIONS.SETTINGS_VIEW,
};

interface PermissionPageGuardProps {
  children: ReactNode;
  /** 自定义权限检查，如果不提供则根据路由自动判断 */
  permission?: string;
}

/**
 * 页面级权限守卫组件
 *
 * 检查用户是否有权限访问当前页面，无权限时显示提示
 *
 * @example
 * <PermissionPageGuard>
 *   <MainLayout>
 *     {/* 页面内容 *\/}
 *   </MainLayout>
 * </PermissionPageGuard>
 */
export function PermissionPageGuard({ children, permission }: PermissionPageGuardProps) {
  const { isAuthenticated, isLoading: authLoading, organization } = useAuth();
  const { hasPermission, isLoading: permissionsLoading, isSuperAdmin } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  // 获取当前路由需要的权限
  const requiredPermission = permission || getRequiredPermission(pathname);

  useEffect(() => {
    // 等待加载完成
    if (authLoading || permissionsLoading) return;

    // 未登录
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [authLoading, permissionsLoading, isAuthenticated, router]);

  // 加载中
  if (authLoading || permissionsLoading) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // 未登录
  if (!isAuthenticated) {
    return null;
  }

  // 无组织时正常渲染（页面内部会处理）
  if (!organization) {
    return <>{children}</>;
  }

  // 检查权限（SuperAdmin 跳过权限检查）
  if (requiredPermission && !isSuperAdmin && !hasPermission(requiredPermission)) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-semibold">无访问权限</h2>
          <p className="text-muted-foreground">您没有权限访问此页面</p>
        </div>
      </MainLayout>
    );
  }

  return <>{children}</>;
}

/**
 * 根据路径获取所需权限
 */
function getRequiredPermission(pathname: string): string | undefined {
  // 精确匹配
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }

  // 前缀匹配（如 /apartments/123）
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route + '/')) {
      return permission;
    }
  }

  // 默认无需特殊权限（如 dashboard）
  return undefined;
}
