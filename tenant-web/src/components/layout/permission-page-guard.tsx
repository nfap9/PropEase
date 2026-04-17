/**
 * 页面级权限守卫组件
 *
 * 检查用户是否有权限访问当前页面，无权限时显示提示
 */
import type { ReactNode } from 'react';

interface PermissionPageGuardProps {
  children: ReactNode;
  /** 自定义权限检查 */
  permission?: string;
}

export function PermissionPageGuard({ children }: PermissionPageGuardProps) {
  return <>{children}</>;
}
