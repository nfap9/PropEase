'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { canAccessRule, type AccessRule } from '@/lib/permission-access';
import { MainLayout } from '@/components/layout/main-layout';
import { ORGANIZATION_ONBOARDING_PATH } from '@/lib/auth/redirect';

/**
 * 路由到权限的映射
 */
const ROUTE_ACCESS_RULES: Record<string, AccessRule> = {
  '/dashboard': { requiresOrganization: true, requireAnyPermission: true },
  '/notifications': { requiresOrganization: true, requireAnyPermission: true },
  '/apartments': { requiresOrganization: true, permission: PERMISSIONS.APARTMENT_VIEW },
  '/rooms': { requiresOrganization: true, permission: PERMISSIONS.ROOM_VIEW },
  '/tenants': { requiresOrganization: true, permission: PERMISSIONS.TENANT_VIEW },
  '/leases': { requiresOrganization: true, permission: PERMISSIONS.LEASE_VIEW },
  '/utilities': { requiresOrganization: true, permission: PERMISSIONS.UTILITY_VIEW },
  '/bills': { requiresOrganization: true, permission: PERMISSIONS.BILL_VIEW },
  '/fee-configs': { requiresOrganization: true, permission: PERMISSIONS.SETTINGS_VIEW },
  '/reports': { requiresOrganization: true, permission: PERMISSIONS.REPORT_VIEW },
  '/settings/team': { permission: PERMISSIONS.MEMBER_VIEW },
  '/settings/notifications': { requiresOrganization: true, permission: PERMISSIONS.SETTINGS_VIEW },
  '/settings/permissions': { requiresOrganization: true, permission: PERMISSIONS.SETTINGS_VIEW },
};

interface PermissionPageGuardProps {
  children: ReactNode;
  /** 自定义权限检查，如果不提供则根据路由自动判断 */
  permission?: string;
  accessRule?: AccessRule;
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
export function PermissionPageGuard({ children, permission, accessRule }: PermissionPageGuardProps) {
  const { isAuthenticated, isLoading: authLoading, organization, organizations } = useAuth();
  const { permissions, hasPermission, isLoading: permissionsLoading, isSuperAdmin } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  // 获取当前路由需要的权限
  const resolvedAccessRule =
    accessRule || (permission ? { permission, requiresOrganization: true } : getAccessRule(pathname));

  useEffect(() => {
    // 等待加载完成
    if (authLoading || permissionsLoading) return;

    // 未登录
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (resolvedAccessRule?.requiresOrganization && !organization && organizations.length === 0) {
      router.replace(ORGANIZATION_ONBOARDING_PATH);
    }
  }, [
    authLoading,
    isAuthenticated,
    organization,
    organizations.length,
    permissionsLoading,
    resolvedAccessRule,
    router,
  ]);

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

  if (resolvedAccessRule?.requiresOrganization && !organization) {
    if (organizations.length === 0) {
      return null;
    }

    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-semibold">请先选择组织</h2>
          <p className="text-muted-foreground">请选择或创建一个组织后再访问此页面</p>
        </div>
      </MainLayout>
    );
  }

  if (
    resolvedAccessRule &&
    !canAccessRule(resolvedAccessRule, {
      organization,
      permissions,
      isSuperAdmin,
      hasPermission,
    })
  ) {
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
function getAccessRule(pathname: string): AccessRule | undefined {
  // 精确匹配
  if (ROUTE_ACCESS_RULES[pathname]) {
    return ROUTE_ACCESS_RULES[pathname];
  }

  // 前缀匹配（如 /apartments/123）
  for (const [route, accessRule] of Object.entries(ROUTE_ACCESS_RULES)) {
    if (pathname.startsWith(route + '/')) {
      return accessRule;
    }
  }

  // 默认无需特殊权限（如 dashboard）
  return undefined;
}
