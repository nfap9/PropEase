import type { Notification, NotificationCategory } from '@apartment-ultra/api-contract';
import { tenantMessages } from '@/i18n';

const notificationTypeLabelMap: Record<string, string> = {
  lease_expiring: tenantMessages.notificationsPage.types.leaseExpiring,
  rent_due_reminder: tenantMessages.notificationsPage.types.rentDueReminder,
  bill_overdue: tenantMessages.notificationsPage.types.billOverdue,
  tenant_move_in: tenantMessages.notificationsPage.types.tenantMoveIn,
  tenant_move_out: tenantMessages.notificationsPage.types.tenantMoveOut,
};

const notificationCategoryLabelMap: Record<NotificationCategory, string> = {
  lease: tenantMessages.notificationsPage.categories.lease,
  billing: tenantMessages.notificationsPage.categories.billing,
  tenant: tenantMessages.notificationsPage.categories.tenant,
  system: tenantMessages.notificationsPage.categories.system,
};

export const notificationCategoryOptions: Array<{
  value: NotificationCategory | 'all';
  label: string;
}> = [
  { value: 'all', label: tenantMessages.notificationsPage.allCategories },
  { value: 'billing', label: tenantMessages.notificationsPage.categories.billing },
  { value: 'lease', label: tenantMessages.notificationsPage.categories.lease },
  { value: 'tenant', label: tenantMessages.notificationsPage.categories.tenant },
  { value: 'system', label: tenantMessages.notificationsPage.categories.system },
];

export function getNotificationTypeLabel(type?: string | null): string {
  if (!type) return tenantMessages.notificationsPage.systemNotification;
  return notificationTypeLabelMap[type] ?? tenantMessages.notificationsPage.systemNotification;
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
  return typeof actionLabel === 'string' && actionLabel ? actionLabel : tenantMessages.notificationsPage.viewDetail;
}
