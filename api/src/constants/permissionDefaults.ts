/**
 * 与 api-legacy/app/utils/permission_defaults.py 对齐的权限与系统角色配置
 */

export const RESOURCES = [
  'apartment',
  'room',
  'tenant',
  'lease',
  'bill',
  'utility',
  'member',
  'settings',
  'report',
] as const;

export const ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'manage'] as const;

export const RESOURCE_NAMES: Record<(typeof RESOURCES)[number], string> = {
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

export const ACTION_NAMES: Record<(typeof ACTIONS)[number], string> = {
  view: '查看',
  create: '创建',
  edit: '编辑',
  delete: '删除',
  export: '导出',
  manage: '管理（全部）',
};

export function getPermissionName(
  resource: (typeof RESOURCES)[number],
  action: (typeof ACTIONS)[number]
): string {
  return `${RESOURCE_NAMES[resource] ?? resource}${ACTION_NAMES[action] ?? action}`;
}

export const SYSTEM_ROLES = [
  'super_admin',
  'support',
  'operations',
  'finance',
  'readonly',
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const SYSTEM_ROLE_CONFIGS: Array<{ role: SystemRole; name: string; description?: string }> = [
  { role: 'super_admin', name: '超级管理员', description: '拥有系统所有权限，可管理所有组织' },
  { role: 'support', name: '客服', description: '可查看所有组织数据，协助用户解决问题' },
  { role: 'operations', name: '运营', description: '可查看和导出数据，进行运营分析' },
  { role: 'finance', name: '财务', description: '可管理账单和查看财务报表' },
  { role: 'readonly', name: '只读', description: '只能查看数据，无修改权限' },
];

/** 系统角色对应的 (resource, action) 列表，与 Python DEFAULT_SYSTEM_ROLE_PERMISSIONS 一致 */
export const DEFAULT_SYSTEM_ROLE_PERMISSIONS: Record<
  SystemRole,
  Array<{ resource: (typeof RESOURCES)[number]; action: (typeof ACTIONS)[number] }>
> = {
  super_admin: (() => {
    const perms: Array<{ resource: (typeof RESOURCES)[number]; action: (typeof ACTIONS)[number] }> = [];
    const actions: Array<(typeof ACTIONS)[number]> = ['view', 'create', 'edit', 'delete', 'export'];
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
