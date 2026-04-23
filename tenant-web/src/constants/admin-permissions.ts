import type { AdminPermissionOption } from '@/types';

/** 运营后台权限选项（按分组），不含「全部权限」单项，勾选模块内全部即表示该模块全部权限 */
export const ADMIN_PERMISSION_OPTIONS: AdminPermissionOption[] = [
  { code: 'admin:user:read', label: '查看', group: '用户管理' },
  { code: 'admin:user:write', label: '编辑', group: '用户管理' },
  { code: 'admin:org:read', label: '查看', group: '团队管理' },
  { code: 'admin:org:write', label: '编辑', group: '团队管理' },
  { code: 'admin:plan:read', label: '查看', group: '服务管理' },
  { code: 'admin:plan:write', label: '编辑', group: '服务管理' },
  { code: 'admin:subscription:read', label: '查看', group: '订阅管理' },
  { code: 'admin:subscription:write', label: '编辑', group: '订阅管理' },
];
