/**
 * 页面级权限守卫组件
 *
 * 检查用户是否有权限访问当前页面，无权限时显示提示
 */
import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionPageGuardProps {
  children: ReactNode;
  /** 自定义权限检查 */
  permission?: string | string[];
  /** 命中策略：任一权限或全部权限 */
  mode?: 'any' | 'all';
}

/**
 * 页面级权限守卫
 * - 无 permission prop 时：直接渲染 children（保留原有行为）
 * - 有 permission prop 时：使用 usePermissions 检查权限
 */
export function PermissionPageGuard({ children, permission, mode = 'all' }: PermissionPageGuardProps) {
  const permissionsHook = usePermissions();

  // 如果没有指定权限要求，直接渲染
  if (!permission) {
    return <>{children}</>;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasPermission = mode === 'all'
    ? permissionsHook.hasAllPermissions(permissions)
    : permissionsHook.hasAnyPermission(permissions);

  if (!hasPermission && !permissionsHook.isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-semibold">无权限访问</h2>
        <p className="text-muted-foreground">您没有权限访问此页面</p>
      </div>
    );
  }

  return <>{children}</>;
}
