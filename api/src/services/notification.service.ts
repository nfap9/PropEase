import type { Notification } from '@prisma/client';
import type { NotificationRepository } from '../repositories/notification.repo.js';
import { defaultNotificationRepo } from '../repositories/notification.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';

export type NotificationCategory = 'lease' | 'billing' | 'tenant' | 'system';

export interface NotificationListOptions {
  limit?: number;
  status?: 'all' | 'unread';
  category?: NotificationCategory | 'all';
}

type NotificationChannelStatus = 'sent' | 'reserved';

type NotificationView = Omit<Notification, 'extra_data'> & {
  extra_data: Record<string, unknown> & {
    category: NotificationCategory;
    target_path?: string;
    action_label?: string;
    channels: {
      in_app: NotificationChannelStatus;
      sms: NotificationChannelStatus;
      wecom: NotificationChannelStatus;
    };
  };
};

const typeCategoryMap: Record<string, NotificationCategory> = {
  lease_expiring: 'lease',
  rent_due_reminder: 'billing',
  bill_overdue: 'billing',
  tenant_move_in: 'tenant',
  tenant_move_out: 'tenant',
};

const typeTargetPathMap: Record<string, string> = {
  lease_expiring: '/leases',
  rent_due_reminder: '/bills',
  bill_overdue: '/bills',
  tenant_move_in: '/leases',
  tenant_move_out: '/leases',
};

const typeActionLabelMap: Record<string, string> = {
  lease_expiring: '查看租约',
  rent_due_reminder: '查看账单',
  bill_overdue: '查看账单',
  tenant_move_in: '查看租约',
  tenant_move_out: '查看租约',
};

function normalizeNotification(record: Notification): NotificationView {
  const extraData =
    record.extra_data && typeof record.extra_data === 'object' && !Array.isArray(record.extra_data)
      ? { ...(record.extra_data as Record<string, unknown>) }
      : {};
  const type = record.type ?? '';
  const category =
    typeof extraData.category === 'string' && extraData.category
      ? (extraData.category as NotificationCategory)
      : (typeCategoryMap[type] ?? 'system');
  const targetPath =
    typeof extraData.target_path === 'string' && extraData.target_path
      ? extraData.target_path
      : typeTargetPathMap[type];
  const actionLabel =
    typeof extraData.action_label === 'string' && extraData.action_label
      ? extraData.action_label
      : typeActionLabelMap[type];

  return {
    ...record,
    extra_data: {
      ...extraData,
      category,
      target_path: targetPath,
      action_label: actionLabel,
      channels: {
        in_app: 'sent',
        sms: 'reserved',
        wecom: 'reserved',
      },
    },
  };
}

/**
 * Notification Service 接口
 */
export interface NotificationService {
  list(userId: string, options?: NotificationListOptions): Promise<NotificationView[]>;
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
    list: async (userId: string, options = {}) => {
      const limit = options.limit ?? 50;
      const status = options.status ?? 'all';
      const category = options.category ?? 'all';
      const list = await getRepo().findByUserId(userId, limit);
      const normalized = list.map(normalizeNotification);

      return normalized.filter((item) => {
        if (status === 'unread' && item.is_read) {
          return false;
        }
        if (category !== 'all' && item.extra_data.category !== category) {
          return false;
        }
        return true;
      });
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
