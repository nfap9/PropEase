
/**
 * 权限守卫组件
 *
 * 提供基于权限的 UI 渲染控制：
 * - PermissionGuard: 权限守卫组件，控制子元素是否渲染
 */
import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permission: string | string[];
  mode?: 'any' | 'all';
  access?: {
    isLoading: boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
  };
}

/**
 * 业务端权限守卫
 */
export function PermissionGuard({ children, permission, mode = 'all' }: PermissionGuardProps) {
  const permissionsHook = usePermissions();

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasPermission = mode === 'all'
    ? permissionsHook.hasAllPermissions(permissions)
    : permissionsHook.hasAnyPermission(permissions);

  if (!hasPermission && !permissionsHook.isLoading) {
    return null;
  }

  return <>{children}</>;
}
