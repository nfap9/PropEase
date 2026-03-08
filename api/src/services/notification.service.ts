import type { Notification } from '@prisma/client';
import type { NotificationRepository } from '../repositories/notification.repo.js';
import { defaultNotificationRepo } from '../repositories/notification.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';

/**
 * Notification Service 接口
 */
export interface NotificationService {
  list(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAllRead(userId: string): Promise<void>;
  markRead(userId: string, id: string): Promise<void>;
}

/**
 * 创建 Notification Service 实例
 */
export function createNotificationService(
  getRepo: () => NotificationRepository = () => defaultNotificationRepo
): NotificationService {
  return {
    list: async (userId: string, limit = 50) => {
      return getRepo().findByUserId(userId, limit);
    },

    getUnreadCount: async (userId: string) => {
      return getRepo().countUnread(userId);
    },

    markAllRead: async (userId: string) => {
      await getRepo().markAllRead(userId);
    },

    markRead: async (userId: string, id: string) => {
      const n = await getRepo().findByIdAndUser(id, userId);
      if (!n) {
        throw createAppError(404, NotFoundMessages.NOTIFICATION);
      }
      await getRepo().markRead(id);
    },
  };
}

/**
 * 默认实例
 */
export const defaultNotificationService = createNotificationService();
