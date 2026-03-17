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
