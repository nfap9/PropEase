import type { Notification, NotificationCategory } from '@apartment-ultra/api-contract';
import {
  NOTIFICATION_TYPE_LABEL_MAP,
  NOTIFICATION_CATEGORY_LABEL_MAP,
} from '@/constants/notifications';

const SYSTEM_NOTIFICATION_LABEL = '系统通知';
const VIEW_DETAIL_LABEL = '查看详情';

export function getNotificationTypeLabel(type?: string | null): string {
  if (!type) return SYSTEM_NOTIFICATION_LABEL;
  return NOTIFICATION_TYPE_LABEL_MAP[type] ?? SYSTEM_NOTIFICATION_LABEL;
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
  return NOTIFICATION_CATEGORY_LABEL_MAP[category];
}

export function getNotificationTarget(item: Notification): string | null {
  const targetPath = item.extra_data?.target_path;
  return typeof targetPath === 'string' && targetPath ? targetPath : null;
}

export function getNotificationActionLabel(item: Notification): string {
  const actionLabel = item.extra_data?.action_label;
  return typeof actionLabel === 'string' && actionLabel ? actionLabel : VIEW_DETAIL_LABEL;
}
