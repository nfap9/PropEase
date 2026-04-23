import type { AdminPermissionOption } from '@/types';
import { ADMIN_PERMISSION_OPTIONS } from '@/constants/admin-permissions';

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
