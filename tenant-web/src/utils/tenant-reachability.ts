import type {
  NotificationDeliveryStatus,
  Tenant,
  TenantNotificationDelivery,
  TenantReachabilityEventType,
} from '@/types';
import {
  EVENT_LABEL_MAP,
  DELIVERY_STATUS_LABEL_MAP,
} from '@/constants/tenant-reachability';

export type TenantSmsReachabilityStatus = 'ready' | 'missing_phone' | 'opted_out';

export function getTenantReachabilityEventLabel(value: TenantReachabilityEventType): string {
  return EVENT_LABEL_MAP[value];
}

export function getDeliveryStatusLabel(status: NotificationDeliveryStatus): string {
  return DELIVERY_STATUS_LABEL_MAP[status];
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
