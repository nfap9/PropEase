import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createNotificationRepository,
  type NotificationRepository,
} from './notification.repo.js';
import type { Notification } from '@prisma/client';

describe('NotificationRepository', () => {
  const mockNotification = {
    findMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
  };

  const mockDb = {
    notification: mockNotification,
  } as unknown as Parameters<typeof createNotificationRepository>[0];
  let repo: NotificationRepository;

  const userId = '01hqtestuser0000001';

  const sampleNotification: Notification = {
    id: '01hqtestnotif000001',
    user_id: userId,
    title: '测试通知',
    content: '这是一条测试通知',
    type: 'system',
    is_read: false,
    created_at: new Date('2024-01-01T10:00:00Z'),
    updated_at: new Date('2024-01-01T10:00:00Z'),
  };

  const readNotification: Notification = {
    ...sampleNotification,
    id: '01hqtestnotif000002',
    is_read: true,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    repo = createNotificationRepository(mockDb);
  });

  describe('findByUserId', () => {
    it('should return notifications ordered by date', async () => {
      const notifications = [sampleNotification, readNotification];
      mockNotification.findMany.mockResolvedValue(notifications);

      const result = await repo.findByUserId(userId, 10);

      expect(mockNotification.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 10,
      });
      expect(result).toEqual(notifications);
    });

    it('should respect limit parameter', async () => {
      mockNotification.findMany.mockResolvedValue([sampleNotification]);

      await repo.findByUserId(userId, 5);

      expect(mockNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });

    it('should return empty array when no notifications', async () => {
      mockNotification.findMany.mockResolvedValue([]);

      const result = await repo.findByUserId(userId, 10);

      expect(result).toEqual([]);
    });
  });

  describe('countUnread', () => {
    it('should count only unread notifications', async () => {
      mockNotification.count.mockResolvedValue(3);

      const result = await repo.countUnread(userId);

      expect(mockNotification.count).toHaveBeenCalledWith({
        where: { user_id: userId, is_read: false },
      });
      expect(result).toBe(3);
    });

    it('should return 0 when no unread notifications', async () => {
      mockNotification.count.mockResolvedValue(0);

      const result = await repo.countUnread(userId);

      expect(result).toBe(0);
    });
  });

  describe('findByIdAndUser', () => {
    it('should return notification when id and userId match', async () => {
      mockNotification.findFirst.mockResolvedValue(sampleNotification);

      const result = await repo.findByIdAndUser(sampleNotification.id, userId);

      expect(mockNotification.findFirst).toHaveBeenCalledWith({
        where: { id: sampleNotification.id, user_id: userId },
      });
      expect(result).toEqual(sampleNotification);
    });

    it('should return null when notification belongs to different user', async () => {
      mockNotification.findFirst.mockResolvedValue(null);

      const result = await repo.findByIdAndUser(sampleNotification.id, 'different-user');

      expect(result).toBeNull();
    });

    it('should return null when notification not found', async () => {
      mockNotification.findFirst.mockResolvedValue(null);

      const result = await repo.findByIdAndUser('non-existent', userId);

      expect(result).toBeNull();
    });
  });

  describe('markAllRead', () => {
    it('should mark all user notifications as read', async () => {
      mockNotification.updateMany.mockResolvedValue({ count: 5 });

      await repo.markAllRead(userId);

      expect(mockNotification.updateMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        data: { is_read: true },
      });
    });
  });

  describe('markRead', () => {
    it('should mark single notification as read', async () => {
      mockNotification.update.mockResolvedValue({
        ...sampleNotification,
        is_read: true,
      });

      await repo.markRead(sampleNotification.id);

      expect(mockNotification.update).toHaveBeenCalledWith({
        where: { id: sampleNotification.id },
        data: { is_read: true },
      });
    });
  });
});
