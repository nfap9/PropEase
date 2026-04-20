/**
 * 权限守卫组件
 */
import { usePermissions } from '@/hooks/use-permissions';
import type { ReactNode } from 'react';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requireAll?: boolean;
}

export function PermissionGuard({ children, requiredPermissions = [], requireAll = false }: PermissionGuardProps) {
  const { isLoading, hasAnyPermission, hasAllPermissions } = usePermissions();

  if (isLoading) {
    return null;
  }

  const hasPermission = requireAll
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);

  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
}
