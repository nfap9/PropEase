import type {
  NotificationDeliveryStatus,
  Tenant,
  TenantNotificationDelivery,
  TenantReachabilityEventType,
} from '@/types';
import { tenantMessages } from '@/lib/i18n';

export type TenantSmsReachabilityStatus = 'ready' | 'missing_phone' | 'opted_out';

const eventLabelMap: Record<TenantReachabilityEventType, string> = {
  bill_generated: tenantMessages.settings.notificationsPage.events.billGenerated,
  rent_due_reminder: tenantMessages.settings.notificationsPage.events.rentDueReminder,
  bill_overdue: tenantMessages.settings.notificationsPage.events.billOverdue,
};

const deliveryStatusLabelMap: Record<NotificationDeliveryStatus, string> = {
  sent: tenantMessages.settings.notificationsPage.stats.sent,
  failed: tenantMessages.settings.notificationsPage.stats.failed,
  skipped: tenantMessages.settings.notificationsPage.stats.skipped,
};

export const tenantReachabilityEventOptions: Array<{
  value: TenantReachabilityEventType | 'all';
  label: string;
}> = [
  { value: 'all', label: tenantMessages.settings.notificationsPage.allEvents },
  { value: 'bill_generated', label: eventLabelMap.bill_generated },
  { value: 'rent_due_reminder', label: eventLabelMap.rent_due_reminder },
  { value: 'bill_overdue', label: eventLabelMap.bill_overdue },
];

export const tenantReachabilityStatusOptions: Array<{
  value: NotificationDeliveryStatus | 'all';
  label: string;
}> = [
  { value: 'all', label: tenantMessages.settings.notificationsPage.allStatuses },
  { value: 'sent', label: deliveryStatusLabelMap.sent },
  { value: 'failed', label: deliveryStatusLabelMap.failed },
  { value: 'skipped', label: deliveryStatusLabelMap.skipped },
];

export function getTenantReachabilityEventLabel(value: TenantReachabilityEventType): string {
  return eventLabelMap[value];
}

export function getDeliveryStatusLabel(status: NotificationDeliveryStatus): string {
  return deliveryStatusLabelMap[status];
}

export function getDeliveryStatusVariant(
  status: NotificationDeliveryStatus
): 'success' | 'destructive' | 'warning' {
  if (status === 'sent') return 'success';
  if (status === 'failed') return 'destructive';
  return 'warning';
}

export function getTenantSmsReachabilityStatus(
  tenant: Pick<Tenant, 'phone' | 'sms_opt_out'>
): TenantSmsReachabilityStatus {
  if (!tenant.phone) return 'missing_phone';
  if (tenant.sms_opt_out) return 'opted_out';
  return 'ready';
}

export function getTenantSmsReachabilityLabel(status: TenantSmsReachabilityStatus): string {
  if (status === 'missing_phone') return '缺少手机号';
  if (status === 'opted_out') return '已退订';
  return '可发送';
}

export function getTenantSmsReachabilityVariant(
  status: TenantSmsReachabilityStatus
): 'success' | 'destructive' | 'warning' {
  if (status === 'ready') return 'success';
  if (status === 'opted_out') return 'warning';
  return 'destructive';
}

export function getDeliverySummary(deliveries: TenantNotificationDelivery[]) {
  return deliveries.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === 'sent') acc.sent += 1;
      if (item.status === 'failed') acc.failed += 1;
      if (item.status === 'skipped') acc.skipped += 1;
      return acc;
    },
    { total: 0, sent: 0, failed: 0, skipped: 0 }
  );
}
