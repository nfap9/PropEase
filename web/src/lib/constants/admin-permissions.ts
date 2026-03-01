/**
 * 运营后台权限选项：仅用中文展示给用户，不暴露权限码。
 * 权限码与后端约定一致，用于 API 请求。
 */
export interface AdminPermissionOption {
  code: string;
  label: string;
  group: string;
}

/** 运营权限选项（按分组） */
export const ADMIN_PERMISSION_OPTIONS: AdminPermissionOption[] = [
  { code: '*', label: '全部权限', group: '全部' },
  { code: 'admin:user:read', label: '查看', group: '用户管理' },
  { code: 'admin:user:write', label: '编辑', group: '用户管理' },
  { code: 'admin:org:read', label: '查看', group: '组织管理' },
  { code: 'admin:org:write', label: '编辑', group: '组织管理' },
  { code: 'admin:plan:read', label: '查看', group: '套餐管理' },
  { code: 'admin:plan:write', label: '编辑', group: '套餐管理' },
  { code: 'admin:subscription:read', label: '查看', group: '订阅管理' },
  { code: 'admin:subscription:write', label: '编辑', group: '订阅管理' },
];

const CODE_TO_LABEL = new Map<string, string>(
  ADMIN_PERMISSION_OPTIONS.map((o) => [o.code, o.group === '全部' ? o.label : `${o.group} · ${o.label}`])
);

/** 将权限码列表转为中文展示（不展示权限码，未知码归为「其他」） */
export function adminPermissionCodesToLabels(codes: string[]): string[] {
  if (!codes?.length) return [];
  if (codes.includes('*')) return ['全部权限'];
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

/** 按分组聚合的选项，用于勾选 UI */
export function getAdminPermissionGroups(): Map<string, AdminPermissionOption[]> {
  const map = new Map<string, AdminPermissionOption[]>();
  for (const opt of ADMIN_PERMISSION_OPTIONS) {
    const list = map.get(opt.group) ?? [];
    list.push(opt);
    map.set(opt.group, list);
  }
  return map;
}
