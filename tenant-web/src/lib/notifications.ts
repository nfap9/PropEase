import type { Notification, NotificationCategory } from '@apartment-ultra/api-contract';

const notificationTypeLabelMap: Record<string, string> = {
  lease_expiring: '合同到期',
  rent_due_reminder: '交租提醒',
  bill_overdue: '逾期催缴',
  tenant_move_in: '新租客入住',
  tenant_move_out: '租客退租',
};

const notificationCategoryLabelMap: Record<NotificationCategory, string> = {
  lease: '租约类',
  billing: '账单类',
  tenant: '租客类',
  system: '系统类',
};

export const notificationCategoryOptions: Array<{
  value: NotificationCategory | 'all';
  label: string;
}> = [
  { value: 'all', label: '全部分类' },
  { value: 'billing', label: '账单类' },
  { value: 'lease', label: '租约类' },
  { value: 'tenant', label: '租客类' },
  { value: 'system', label: '系统类' },
];

export function getNotificationTypeLabel(type?: string | null): string {
  if (!type) return '系统通知';
  return notificationTypeLabelMap[type] ?? '系统通知';
}

export function getNotificationCategory(item: Notification): NotificationCategory {
  const rawCategory = item.extra_data?.category;

  if (
    rawCategory === 'lease' ||
    rawCategory === 'billing' ||
    rawCategory === 'tenant' ||
    rawCategory === 'system'
  ) {
    return rawCategory;
  }

  return 'system';
}

export function getNotificationCategoryLabel(category: NotificationCategory): string {
  return notificationCategoryLabelMap[category];
}

export function getNotificationTarget(item: Notification): string | null {
  const targetPath = item.extra_data?.target_path;
  return typeof targetPath === 'string' && targetPath ? targetPath : null;
}

export function getNotificationActionLabel(item: Notification): string {
  const actionLabel = item.extra_data?.action_label;
  return typeof actionLabel === 'string' && actionLabel ? actionLabel : '查看详情';
}
