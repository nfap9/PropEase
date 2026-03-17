import { describe, expect, it } from 'vitest';
import {
  getNotificationActionLabel,
  getNotificationCategory,
  getNotificationTarget,
  getNotificationTypeLabel,
} from './notifications';

describe('notification helpers', () => {
  it('should read normalized metadata from notification payload', () => {
    const notification = {
      id: '01notif',
      user_id: '01user',
      title: '账单逾期提醒',
      content: '请处理',
      type: 'bill_overdue',
      is_read: false,
      extra_data: {
        category: 'billing',
        target_path: '/bills',
        action_label: '查看账单',
      },
      created_at: '2026-03-17T08:00:00.000Z',
      updated_at: '2026-03-17T08:00:00.000Z',
    } as const;

    expect(getNotificationTypeLabel(notification.type)).toBe('逾期催缴');
    expect(getNotificationCategory(notification)).toBe('billing');
    expect(getNotificationTarget(notification)).toBe('/bills');
    expect(getNotificationActionLabel(notification)).toBe('查看账单');
  });
});
