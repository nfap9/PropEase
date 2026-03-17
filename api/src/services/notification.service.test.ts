import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNotificationService, type NotificationService } from './notification.service.js';
import type { NotificationRepository } from '../repositories/notification.repo.js';

describe('NotificationService', () => {
  const mockRepo: NotificationRepository = {
    findByUserId: vi.fn(),
    countUnread: vi.fn(),
    findByIdAndUser: vi.fn(),
    markAllRead: vi.fn(),
    markRead: vi.fn(),
  };

  let service: NotificationService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = createNotificationService(() => mockRepo);
  });

  it('should enrich notification metadata and keep reserved channels', async () => {
    vi.mocked(mockRepo.findByUserId).mockResolvedValue([
      {
        id: '01notif1',
        user_id: '01user',
        organization_id: '01org',
        title: '账单逾期提醒 - 张三',
        content: '请尽快处理',
        type: 'bill_overdue',
        is_read: false,
        extra_data: null,
        created_at: new Date('2026-03-17T08:00:00Z'),
        updated_at: new Date('2026-03-17T08:00:00Z'),
      },
    ] as any);

    const result = await service.list('01user');

    expect(result).toHaveLength(1);
    expect(result[0].extra_data.category).toBe('billing');
    expect(result[0].extra_data.target_path).toBe('/bills');
    expect(result[0].extra_data.action_label).toBe('查看账单');
    expect(result[0].extra_data.channels).toEqual({
      in_app: 'sent',
      sms: 'reserved',
      wecom: 'reserved',
    });
  });

  it('should support unread and category filtering', async () => {
    vi.mocked(mockRepo.findByUserId).mockResolvedValue([
      {
        id: '01notif1',
        user_id: '01user',
        organization_id: '01org',
        title: '账单提醒',
        content: 'A',
        type: 'bill_overdue',
        is_read: false,
        extra_data: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '01notif2',
        user_id: '01user',
        organization_id: '01org',
        title: '租客入住',
        content: 'B',
        type: 'tenant_move_in',
        is_read: true,
        extra_data: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ] as any);

    const result = await service.list('01user', {
      status: 'unread',
      category: 'billing',
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('bill_overdue');
  });
});
