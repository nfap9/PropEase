import type { MemberRole } from './organizations.js';

// ===== 权限码常量（共享给所有应用） =====

/** 资源类型 */
export const RESOURCES = ['apartment', 'room', 'tenant', 'lease', 'bill', 'utility', 'member', 'settings', 'report'] as const;
export type Resource = typeof RESOURCES[number];

/** 操作类型 */
export const ACTIONS = ['view', 'create', 'edit', 'delete', 'export'] as const;
export type Action = typeof ACTIONS[number];

/** 资源中文名 */
export const RESOURCE_NAMES: Record<Resource, string> = {
  apartment: '公寓管理',
  room: '房间管理',
  tenant: '租客管理',
  lease: '租约管理',
  bill: '账单管理',
  utility: '水电管理',
  member: '成员管理',
  settings: '系统设置',
  report: '报表分析',
};

/** 操作中文名 */
export const ACTION_NAMES: Record<Action, string> = {
  view: '查看',
  create: '创建',
  edit: '编辑',
  delete: '删除',
  export: '导出',
};

/**
 * 将 (resource, action) 列表转为权限码列表
 * 例如: [{ resource: 'apartment', action: 'view' }] => ['apartment:view']
 */
export function toPermissionCodes(
  perms: Array<{ resource: Resource; action: Action }>
): string[] {
  return perms.map((p) => `${p.resource}:${p.action}`);
}

/** 权限 */
export interface Permission {
  id: string;
  resource: Resource;
  action: Action;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
}

/** 角色权限 */
export interface RolePermissions {
  role: MemberRole;
  permissions: Permission[];
}

/** 更新角色权限请求 */
export interface UpdateRolePermissionsRequest {
  permission_codes: string[];
}

/** 系统角色 */
export type SystemRole =
  | 'super_admin'
  | 'support'
  | 'operations'
  | 'finance'
  | 'readonly';

/** 用户权限响应 */
export interface UserPermissionsResponse {
  permissions: string[];
  system_roles: SystemRole[];
  is_super_admin: boolean;
}

/** 系统角色配置 */
export interface SystemRoleConfig {
  role: SystemRole;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}
