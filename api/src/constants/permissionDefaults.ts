/**
 * 权限常量 — 静态定义，无需数据库存储
 */

import type { Resource, Action } from '@propease/api-contract';

// Re-export from api-contract
export { RESOURCES, ACTIONS, toPermissionCodes } from '@propease/api-contract';
export type { Resource, Action };

// 资源模块（无 settings）
export const RESOURCE_MODULES = ['apartment', 'room', 'tenant', 'lease', 'bill', 'utility', 'member', 'report'] as const;
export type ResourceModule = (typeof RESOURCE_MODULES)[number];

// 操作类型
export const ACTION_TYPES = ['view', 'create', 'edit', 'delete', 'export'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

// 预制角色名称
export const SYSTEM_ORG_ROLES = ['组织所有者', '公寓管理人', '一般合伙人'] as const;
export type SystemOrgRoleName = (typeof SYSTEM_ORG_ROLES)[number];

/**
 * 生成权限码
 */
export function toPermissionCode(resource: Resource, action: Action): string {
  return `${resource}:${action}`;
}

/**
 * 预制角色的默认权限码数组
 * 组织所有者：全部45个权限（9个模块 × 5个操作）
 * 公寓管理人：40个权限（8个模块 × 5个操作，无 settings）
 * 一般合伙人：16个权限（8个模块 × 2个操作 view/export，无 settings）
 */
export const DEFAULT_ORG_ROLE_PERMISSIONS: Record<SystemOrgRoleName, string[]> = {
  '组织所有者': (() => {
    const codes: string[] = [];
    for (const resource of ['apartment', 'room', 'tenant', 'lease', 'bill', 'utility', 'member', 'settings', 'report'] as Resource[]) {
      for (const action of ACTION_TYPES) {
        codes.push(toPermissionCode(resource, action));
      }
    }
    return codes;
  })(),
  '公寓管理人': (() => {
    const codes: string[] = [];
    for (const resource of RESOURCE_MODULES) {
      for (const action of ACTION_TYPES) {
        codes.push(toPermissionCode(resource, action));
      }
    }
    return codes;
  })(),
  '一般合伙人': (() => {
    const codes: string[] = [];
    for (const resource of RESOURCE_MODULES) {
      for (const action of ['view', 'export'] as Action[]) {
        codes.push(toPermissionCode(resource, action));
      }
    }
    return codes;
  })(),
};

/**
 * 预制角色定义
 */
export interface DefaultOrgRole {
  name: SystemOrgRoleName;
  description: string;
  is_system: true;
  permissions: string[];
}

export const DEFAULT_ORG_ROLES: DefaultOrgRole[] = [
  {
    name: '组织所有者',
    description: '拥有组织的全部权限，可管理所有功能和成员',
    is_system: true,
    permissions: DEFAULT_ORG_ROLE_PERMISSIONS['组织所有者'],
  },
  {
    name: '公寓管理人',
    description: '拥有除系统设置外的所有权限，可管理日常运营',
    is_system: true,
    permissions: DEFAULT_ORG_ROLE_PERMISSIONS['公寓管理人'],
  },
  {
    name: '一般合伙人',
    description: '拥有查看和导出权限，可查看数据但无法修改',
    is_system: true,
    permissions: DEFAULT_ORG_ROLE_PERMISSIONS['一般合伙人'],
  },
];
