/**
 * 共享状态配置 - 统一各类状态的标签、变体、图标
 */
export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info';

/** 组织/用户启用状态 */
export const ORG_STATUS_CONFIG = {
  active: { label: '启用', variant: 'success' as BadgeVariant },
  inactive: { label: '停用', variant: 'secondary' as BadgeVariant },
};

/** 是/否（如个人团队、自动续费、启用） */
export const BOOLEAN_YES_NO_CONFIG = {
  yes: { label: '是', variant: 'secondary' as BadgeVariant },
  no: { label: '否', variant: 'outline' as BadgeVariant },
};
