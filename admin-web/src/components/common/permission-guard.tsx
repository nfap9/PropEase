'use client';

/**
 * 权限守卫组件
 *
 * 提供基于权限的 UI 渲染控制（运营后台版本）：
 * - PermissionGuard: 权限守卫组件，控制子元素是否渲染
 * - withPermission: 高阶组件，为组件添加权限控制
 *
 * 基于 shared-ui 的通用权限逻辑，适配运营端的权限上下文
 */
import {
  createPermissionGuard,
  createWithPermission,
  type PermissionAccess,
} from '@apartment-ultra/shared-ui/components/ui';
import { usePermissions } from '@/hooks/use-permissions';

/**
 * 适配运营端的权限访问接口
 * 将 usePermissions hook 的方法转换为 PermissionAccess 接口
 */
function useAdminPermissionAccess(): PermissionAccess {
  const { isLoading, hasAnyPermission, hasAllPermissions } = usePermissions();

  return {
    isLoading,
    hasAnyPermission,
    hasAllPermissions,
  };
}

/**
 * 运营端权限守卫
 * 复用 shared-ui 的通用逻辑，仅保留与本端权限上下文的适配
 */
export const PermissionGuard = createPermissionGuard(useAdminPermissionAccess);

/**
 * 运营端高阶权限守卫
 * 用于包装需要权限检查的组件
 */
export const withPermission = createWithPermission(PermissionGuard);
