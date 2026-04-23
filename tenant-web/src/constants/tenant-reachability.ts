import type {
  NotificationDeliveryStatus,
  TenantReachabilityEventType,
} from '@/types';

/** 事件类型 → 中文标签（静态配置） */
const EVENT_LABEL_MAP: Record<TenantReachabilityEventType, string> = {
  bill_generated: '账单生成',
  rent_due_reminder: '租金到期提醒',
  bill_overdue: '账单逾期',
};

/** 发送状态 → 中文标签（静态配置） */
const DELIVERY_STATUS_LABEL_MAP: Record<NotificationDeliveryStatus, string> = {
  sent: '已发送',
  failed: '发送失败',
  skipped: '已跳过',
};

export const TENANT_REACHABILITY_EVENT_OPTIONS: Array<{
  value: TenantReachabilityEventType | 'all';
  label: string;
}> = [
  { value: 'all', label: '全部事件' },
  { value: 'bill_generated', label: EVENT_LABEL_MAP.bill_generated },
  { value: 'rent_due_reminder', label: EVENT_LABEL_MAP.rent_due_reminder },
  { value: 'bill_overdue', label: EVENT_LABEL_MAP.bill_overdue },
];

export const TENANT_REACHABILITY_STATUS_OPTIONS: Array<{
  value: NotificationDeliveryStatus | 'all';
  label: string;
}> = [
  { value: 'all', label: '全部状态' },
  { value: 'sent', label: DELIVERY_STATUS_LABEL_MAP.sent },
  { value: 'failed', label: DELIVERY_STATUS_LABEL_MAP.failed },
  { value: 'skipped', label: DELIVERY_STATUS_LABEL_MAP.skipped },
];

export { EVENT_LABEL_MAP, DELIVERY_STATUS_LABEL_MAP };
