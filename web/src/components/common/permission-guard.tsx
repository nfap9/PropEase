'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGuardProps {
  /** 权限代码或权限代码数组 */
  permission: string | string[];
  /** 检查模式：any = 任一权限，all = 所有权限 */
  mode?: 'any' | 'all';
  /** 子元素 */
  children: ReactNode;
  /** 无权限时显示的内容 */
  fallback?: ReactNode;
}

/**
 * 权限守卫组件
 *
 * 用于根据权限控制子元素的显示
 *
 * @example
 * // 单个权限
 * <PermissionGuard permission="apartment:create">
 *   <Button>创建公寓</Button>
 * </PermissionGuard>
 *
 * @example
 * // 多个权限（任一）
 * <PermissionGuard permission={['apartment:create', 'apartment:edit']} mode="any">
 *   <Button>操作</Button>
 * </PermissionGuard>
 *
 * @example
 * // 无权限时显示备用内容
 * <PermissionGuard permission="settings:edit" fallback={<span>无权限</span>}>
 *   <Button>编辑设置</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  mode = 'all',
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasAnyPermission, hasAllPermissions, isLoading } =
    usePermissions();

  // 加载中不显示
  if (isLoading) {
    return null;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasAccess =
    mode === 'any'
      ? hasAnyPermission(permissions)
      : hasAllPermissions(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * 高阶组件版本的权限守卫
 *
 * @example
 * const CreateApartmentButton = withPermission(Button, 'apartment:create');
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string | string[],
  mode?: 'any' | 'all',
  fallback?: ReactNode
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard permission={permission} mode={mode} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}
