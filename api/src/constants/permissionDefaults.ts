/**
 * 权限常量 — 从 @apartment-ultra/api-contract 导入共享部分
 * 系统角色和默认权限配置保留在本地（后端特定）
 */

import {
  RESOURCES,
  ACTIONS,
  RESOURCE_NAMES,
  ACTION_NAMES,
  toPermissionCodes,
  type Resource,
  type Action,
} from '@apartment-ultra/api-contract';

// Re-export for backwards compatibility — 内部模块从 permissionDefaults 导入
export { RESOURCES, ACTIONS, toPermissionCodes };
export type { Resource, Action };

// UI 标签保留在 per-app（中文本地化）
export { RESOURCE_NAMES, ACTION_NAMES };

export const SYSTEM_ROLES = [
  'super_admin',
  'support',
  'operations',
  'finance',
  'readonly',
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const SYSTEM_ROLE_CONFIGS: Array<{ role: SystemRole; name: string; description?: string }> =
  [
    { role: 'super_admin', name: '超级管理员', description: '拥有系统所有权限，可管理所有组织' },
    { role: 'support', name: '客服', description: '可查看所有组织数据，协助用户解决问题' },
    { role: 'operations', name: '运营', description: '可查看和导出数据，进行运营分析' },
    { role: 'finance', name: '财务', description: '可管理账单和查看财务报表' },
    { role: 'readonly', name: '只读', description: '只能查看数据，无修改权限' },
  ];

/** 系统角色对应的 (resource, action) 列表 */
export const DEFAULT_SYSTEM_ROLE_PERMISSIONS: Record<
  SystemRole,
  Array<{ resource: Resource; action: Action }>
> = {
  super_admin: (() => {
    const perms: Array<{ resource: Resource; action: Action }> = [];
    const actions: Action[] = ['view', 'create', 'edit', 'delete', 'export'];
    for (const r of RESOURCES) for (const a of actions) perms.push({ resource: r, action: a });
    return perms;
  })(),
  support: [
    { resource: 'apartment', action: 'view' },
    { resource: 'room', action: 'view' },
    { resource: 'tenant', action: 'view' },
    { resource: 'tenant', action: 'edit' },
    { resource: 'lease', action: 'view' },
    { resource: 'bill', action: 'view' },
    { resource: 'utility', action: 'view' },
    { resource: 'member', action: 'view' },
    { resource: 'report', action: 'view' },
  ],
  operations: [
    { resource: 'apartment', action: 'view' },
    { resource: 'room', action: 'view' },
    { resource: 'tenant', action: 'view' },
    { resource: 'lease', action: 'view' },
    { resource: 'bill', action: 'view' },
    { resource: 'bill', action: 'export' },
    { resource: 'utility', action: 'view' },
    { resource: 'member', action: 'view' },
    { resource: 'settings', action: 'view' },
    { resource: 'report', action: 'view' },
    { resource: 'report', action: 'export' },
  ],
  finance: [
    { resource: 'bill', action: 'view' },
    { resource: 'bill', action: 'create' },
    { resource: 'bill', action: 'edit' },
    { resource: 'bill', action: 'export' },
    { resource: 'lease', action: 'view' },
    { resource: 'tenant', action: 'view' },
    { resource: 'room', action: 'view' },
    { resource: 'report', action: 'view' },
    { resource: 'report', action: 'export' },
  ],
  readonly: [
    { resource: 'apartment', action: 'view' },
    { resource: 'room', action: 'view' },
    { resource: 'tenant', action: 'view' },
    { resource: 'lease', action: 'view' },
    { resource: 'bill', action: 'view' },
    { resource: 'utility', action: 'view' },
    { resource: 'member', action: 'view' },
  ],
};

/** 组织内固定角色（MemberRole，不含 owner） */
export const ORG_MEMBER_ROLES = ['admin', 'member', 'viewer'] as const;
export type OrgMemberRole = (typeof ORG_MEMBER_ROLES)[number];

/** 组织角色默认权限（(resource, action) 列表），用于未自定义时的 GET 与 /me 计算 */
export const DEFAULT_ORG_ROLE_PERMISSIONS: Record<
  OrgMemberRole,
  Array<{ resource: Resource; action: Action }>
> = {
  admin: (() => {
    const perms: Array<{ resource: Resource; action: Action }> = [];
    const actions: Action[] = ['view', 'create', 'edit', 'delete', 'export'];
    for (const r of RESOURCES) for (const a of actions) perms.push({ resource: r, action: a });
    return perms;
  })(),
  member: [
    { resource: 'apartment', action: 'view' },
    { resource: 'apartment', action: 'create' },
    { resource: 'apartment', action: 'edit' },
    { resource: 'room', action: 'view' },
    { resource: 'room', action: 'create' },
    { resource: 'room', action: 'edit' },
    { resource: 'tenant', action: 'view' },
    { resource: 'tenant', action: 'create' },
    { resource: 'tenant', action: 'edit' },
    { resource: 'lease', action: 'view' },
    { resource: 'lease', action: 'create' },
    { resource: 'lease', action: 'edit' },
    { resource: 'bill', action: 'view' },
    { resource: 'bill', action: 'create' },
    { resource: 'bill', action: 'edit' },
    { resource: 'utility', action: 'view' },
    { resource: 'utility', action: 'create' },
    { resource: 'utility', action: 'edit' },
    { resource: 'member', action: 'view' },
    { resource: 'settings', action: 'view' },
    { resource: 'report', action: 'view' },
    { resource: 'report', action: 'export' },
  ],
  viewer: [
    { resource: 'apartment', action: 'view' },
    { resource: 'room', action: 'view' },
    { resource: 'tenant', action: 'view' },
    { resource: 'lease', action: 'view' },
    { resource: 'bill', action: 'view' },
    { resource: 'utility', action: 'view' },
    { resource: 'member', action: 'view' },
    { resource: 'report', action: 'view' },
  ],
};
