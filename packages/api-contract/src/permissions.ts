import type { MemberRole } from './organizations.js';

/** 资源 */
export type Resource =
  | 'apartment'
  | 'room'
  | 'tenant'
  | 'lease'
  | 'bill'
  | 'utility'
  | 'member'
  | 'settings'
  | 'report';

/** 操作 */
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'manage';

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
