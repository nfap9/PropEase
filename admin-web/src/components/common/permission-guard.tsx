'use client';

import {
  createPermissionGuard,
  createWithPermission,
  type PermissionAccess,
} from '@apartment-ultra/shared-ui/components/ui';
import { usePermissions } from '@/hooks/use-permissions';

function useAdminPermissionAccess(): PermissionAccess {
  const { isLoading, hasAnyPermission, hasAllPermissions } = usePermissions();

  return {
    isLoading,
    hasAnyPermission,
    hasAllPermissions,
  };
}

/**
 * 运营端权限守卫。
 * 复用 shared-ui 的通用逻辑，仅保留与本端权限上下文的适配。
 */
export const PermissionGuard = createPermissionGuard(useAdminPermissionAccess);

/**
 * 运营端高阶权限守卫。
 */
export const withPermission = createWithPermission(PermissionGuard);
