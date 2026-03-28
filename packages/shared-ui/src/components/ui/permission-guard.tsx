'use client';

import * as React from 'react';

type PermissionMode = 'any' | 'all';

/**
 * 权限访问能力定义。
 * 由业务端基于自己的权限上下文适配后传入共享守卫组件。
 */
export interface PermissionAccess {
  isLoading: boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export interface PermissionGuardProps {
  /** 权限码或权限码数组。 */
  permission: string | string[];
  /** 命中策略：任一权限或全部权限。 */
  mode?: PermissionMode;
  /** 权限系统访问能力。 */
  access: PermissionAccess;
  /** 有权限时渲染的内容。 */
  children: React.ReactNode;
  /** 无权限时渲染的兜底内容。 */
  fallback?: React.ReactNode;
}

/**
 * 共享权限守卫核心组件。
 *
 * 说明：
 * - 共享层只负责“展示逻辑”，不直接耦合某一端的权限来源；
 * - admin / tenant 端可通过各自的 `usePermissions()` 适配后复用该组件；
 * - 这样既能统一行为，又不会把共享包与业务上下文绑定死。
 */
export function PermissionGuard({ permission, mode = 'all', access, children, fallback = null }: PermissionGuardProps) {
  if (access.isLoading) {
    return null;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = mode === 'any' ? access.hasAnyPermission(permissions) : access.hasAllPermissions(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * 创建应用侧权限守卫组件。
 * 适用于 admin / tenant 这类“权限 hook 相似但上下文来源不同”的场景。
 */
export function createPermissionGuard(usePermissionAccess: () => PermissionAccess) {
  function AppPermissionGuard({
    permission,
    mode = 'all',
    children,
    fallback = null,
  }: Omit<PermissionGuardProps, 'access'>) {
    const access = usePermissionAccess();

    return (
      <PermissionGuard permission={permission} mode={mode} access={access} fallback={fallback}>
        {children}
      </PermissionGuard>
    );
  }

  AppPermissionGuard.displayName = 'AppPermissionGuard';

  return AppPermissionGuard;
}

/**
 * 创建高阶组件版本的权限守卫。
 */
export function createWithPermission(PermissionComponent: React.ComponentType<Omit<PermissionGuardProps, 'access'>>) {
  return function withPermission<P extends object>(
    Component: React.ComponentType<P>,
    permission: string | string[],
    mode?: PermissionMode,
    fallback?: React.ReactNode
  ) {
    function PermissionWrappedComponent(props: P) {
      return (
        <PermissionComponent permission={permission} mode={mode} fallback={fallback}>
          <Component {...props} />
        </PermissionComponent>
      );
    }

    PermissionWrappedComponent.displayName = `WithPermission(${
      Component.displayName || Component.name || 'Component'
    })`;

    return PermissionWrappedComponent;
  };
}
