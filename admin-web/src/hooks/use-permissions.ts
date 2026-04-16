
import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '@/api/permissions';
import { useAuth } from '@/contexts/auth';
import type { SystemRole } from '@/types';

/**
 * 权限 Hook
 *
 * 用于获取和检查当前用户在当前组织中的权限
 */
export function usePermissions(orgId?: string) {
  const { organization } = useAuth();
  const targetOrgId = orgId || organization?.id;

  const { data: response, isLoading } = useQuery({
    queryKey: ['my-permissions', targetOrgId],
    queryFn: () => (targetOrgId ? permissionsApi.getMyPermissions(targetOrgId) : null),
    enabled: !!targetOrgId,
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
  });

  const permissions = response?.permissions || [];
  const systemRoles = response?.system_roles || [];
  const isSuperAdmin = response?.is_super_admin || false;

  /**
   * 检查是否拥有单个权限
   */
  const hasPermission = (code: string): boolean => {
    if (isSuperAdmin) return true;
    return permissions.includes(code);
  };

  /**
   * 检查是否拥有任一权限
   */
  const hasAnyPermission = (codes: string[]): boolean => {
    if (isSuperAdmin) return true;
    return codes.some((code) => permissions.includes(code));
  };

  /**
   * 检查是否拥有所有权限
   */
  const hasAllPermissions = (codes: string[]): boolean => {
    if (isSuperAdmin) return true;
    return codes.every((code) => permissions.includes(code));
  };

  /**
   * 检查是否拥有系统角色
   */
  const hasSystemRole = (role: string): boolean => {
    return systemRoles.includes(role as SystemRole);
  };

  return {
    permissions,
    systemRoles,
    isSuperAdmin,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasSystemRole,
  };
}

/**
 * 权限资源常量
 */
export const PERMISSIONS = {
  // 公寓
  APARTMENT_VIEW: 'apartment:view',
  APARTMENT_CREATE: 'apartment:create',
  APARTMENT_EDIT: 'apartment:edit',
  APARTMENT_DELETE: 'apartment:delete',
  // 房间
  ROOM_VIEW: 'room:view',
  ROOM_CREATE: 'room:create',
  ROOM_EDIT: 'room:edit',
  ROOM_DELETE: 'room:delete',
  // 租客
  TENANT_VIEW: 'tenant:view',
  TENANT_CREATE: 'tenant:create',
  TENANT_EDIT: 'tenant:edit',
  TENANT_DELETE: 'tenant:delete',
  // 租约
  LEASE_VIEW: 'lease:view',
  LEASE_CREATE: 'lease:create',
  LEASE_EDIT: 'lease:edit',
  LEASE_DELETE: 'lease:delete',
  // 账单
  BILL_VIEW: 'bill:view',
  BILL_CREATE: 'bill:create',
  BILL_EDIT: 'bill:edit',
  BILL_DELETE: 'bill:delete',
  BILL_EXPORT: 'bill:export',
  // 水电
  UTILITY_VIEW: 'utility:view',
  UTILITY_CREATE: 'utility:create',
  UTILITY_EDIT: 'utility:edit',
  UTILITY_DELETE: 'utility:delete',
  // 成员
  MEMBER_VIEW: 'member:view',
  MEMBER_CREATE: 'member:create',
  MEMBER_EDIT: 'member:edit',
  MEMBER_DELETE: 'member:delete',
  // 设置
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  // 报表
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
