import type { Notification, Prisma } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * Notification Repository 接口
 */
export interface NotificationRepository {
  findByUserId(userId: string, limit: number): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  findByIdAndUser(id: string, userId: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<void>;
  markRead(id: string): Promise<void>;
  create(data: Prisma.NotificationCreateInput): Promise<Notification>;
}

/**
 * 创建 Notification Repository 实例
 */
export function createNotificationRepository(db: DbClient): NotificationRepository {
  return {
    findByUserId: async (userId: string, limit: number) => {
      return db.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    },

    countUnread: async (userId: string) => {
      return db.notification.count({
        where: { user_id: userId, is_read: false },
      });
    },

    findByIdAndUser: async (id: string, userId: string) => {
      return db.notification.findFirst({
        where: { id, user_id: userId },
      });
    },

    markAllRead: async (userId: string) => {
      await db.notification.updateMany({
        where: { user_id: userId },
        data: { is_read: true },
      });
    },

    markRead: async (id: string) => {
      await db.notification.update({
        where: { id },
        data: { is_read: true },
      });
    },

    create: async (data: Prisma.NotificationCreateInput) => {
      return db.notification.create({ data });
    },
  };
}

/**
 * 默认实例
 */
export const defaultNotificationRepo = createNotificationRepository(prisma);
