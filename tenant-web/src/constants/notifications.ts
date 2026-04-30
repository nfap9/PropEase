import type { NotificationCategory } from '@propease/api-contract';

/** 通知类型 → 中文标签（静态配置） */
const NOTIFICATION_TYPE_LABEL_MAP: Record<string, string> = {
  lease_expiring: '租约即将到期',
  rent_due_reminder: '租金到期提醒',
  bill_overdue: '账单逾期',
  tenant_move_in: '入住',
  tenant_move_out: '退房',
};

/** 通知分类 → 中文标签（静态配置） */
const NOTIFICATION_CATEGORY_LABEL_MAP: Record<NotificationCategory, string> = {
  lease: '租约',
  billing: '账单',
  tenant: '租客',
  system: '系统',
};

export const NOTIFICATION_CATEGORY_OPTIONS: Array<{
  value: NotificationCategory | 'all';
  label: string;
}> = [
  { value: 'all', label: '全部' },
  { value: 'billing', label: '账单' },
  { value: 'lease', label: '租约' },
  { value: 'tenant', label: '租客' },
  { value: 'system', label: '系统' },
];

export { NOTIFICATION_TYPE_LABEL_MAP, NOTIFICATION_CATEGORY_LABEL_MAP };
