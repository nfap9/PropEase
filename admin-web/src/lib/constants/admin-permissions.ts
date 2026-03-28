/**
 * 运营后台权限选项：仅用中文展示给用户，不暴露权限码。
 * 权限码与后端约定一致，用于 API 请求。
 */
export interface AdminPermissionOption {
  code: string;
  label: string;
  group: string;
}

/** 运营权限选项（按分组），不含「全部权限」单项，勾选模块内全部即表示该模块全部权限 */
export const ADMIN_PERMISSION_OPTIONS: AdminPermissionOption[] = [
  { code: 'admin:user:read', label: '查看', group: '用户管理' },
  { code: 'admin:user:write', label: '编辑', group: '用户管理' },
  { code: 'admin:org:read', label: '查看', group: '团队管理' },
  { code: 'admin:org:write', label: '编辑', group: '团队管理' },
  { code: 'admin:plan:read', label: '查看', group: '服务管理' },
  { code: 'admin:plan:write', label: '编辑', group: '服务管理' },
  { code: 'admin:subscription:read', label: '查看', group: '已购服务' },
  { code: 'admin:subscription:write', label: '编辑', group: '已购服务' },
];

const CODE_TO_LABEL = new Map<string, string>(
  ADMIN_PERMISSION_OPTIONS.map((o) => [o.code, `${o.group} · ${o.label}`])
);

/** 将权限码列表转为中文展示（不展示权限码，未知码归为「其他」） */
export function adminPermissionCodesToLabels(codes: string[]): string[] {
  if (!codes?.length) return [];
  const labels: string[] = [];
  let hasOther = false;
  for (const c of codes) {
    const label = CODE_TO_LABEL.get(c);
    if (label) labels.push(label);
    else hasOther = true;
  }
  if (hasOther) labels.push('其他');
  return labels;
}

/** 表格/摘要中展示的权限文案（中文，逗号分隔） */
export function formatAdminPermissionsForDisplay(codes: string[]): string {
  const labels = adminPermissionCodesToLabels(codes);
  if (labels.length === 0) return '—';
  if (labels.length <= 5) return labels.join('、');
  return `${labels.slice(0, 3).join('、')} 等 ${labels.length} 项`;
}

/** 按分组聚合的选项，用于勾选 UI（树形展示，无「全部」单项） */
export function getAdminPermissionGroups(): Map<string, AdminPermissionOption[]> {
  const map = new Map<string, AdminPermissionOption[]>();
  for (const opt of ADMIN_PERMISSION_OPTIONS) {
    const list = map.get(opt.group) ?? [];
    list.push(opt);
    map.set(opt.group, list);
  }
  return map;
}

/** 所有运营权限码（用于将历史「*」展开为具体码） */
export function getAllAdminPermissionCodes(): string[] {
  return ADMIN_PERMISSION_OPTIONS.map((o) => o.code);
}
