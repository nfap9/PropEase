export type NotificationType =
  | 'lease_expiring'
  | 'rent_due_reminder'
  | 'bill_overdue'
  | 'tenant_move_in'
  | 'tenant_move_out'
  | (string & {});

export type NotificationCategory = 'lease' | 'billing' | 'tenant' | 'system';

export type NotificationChannelName = 'in_app' | 'sms' | 'wecom';

export type NotificationChannelStatus = 'sent' | 'reserved';

export type TenantReachabilityChannel = 'sms';

export type TenantReachabilityEventType = 'bill_generated' | 'rent_due_reminder' | 'bill_overdue';

export type NotificationDeliveryStatus = 'sent' | 'failed' | 'skipped';

export interface NotificationExtraData extends Record<string, unknown> {
  category?: NotificationCategory;
  target_path?: string;
  action_label?: string;
  channels?: Partial<Record<NotificationChannelName, NotificationChannelStatus>>;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type?: NotificationType | null;
  is_read: boolean;
  extra_data?: NotificationExtraData | null;
  created_at: string;
  updated_at: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface TenantNotificationTemplate {
  id: string | null;
  organization_id: string;
  channel: TenantReachabilityChannel;
  event_type: TenantReachabilityEventType;
  name: string;
  content: string;
  is_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface TenantNotificationDelivery {
  id: string;
  organization_id: string;
  tenant_id: string | null;
  tenant_name: string | null;
  lease_id: string | null;
  bill_id: string | null;
  template_id: string | null;
  template_name: string | null;
  channel: TenantReachabilityChannel;
  event_type: TenantReachabilityEventType;
  recipient: string | null;
  status: NotificationDeliveryStatus;
  content: string;
  provider_message_id: string | null;
  status_reason: string | null;
  room_number: string | null;
  created_at: string;
  updated_at: string;
  extra_data?: Record<string, unknown> | null;
}
