import api from './client';
import type { Notification } from '@apartment-ultra/api-contract';

export interface NotificationsListParams {
  org_id?: string;
  is_read?: boolean;
}

export const notificationsApi = {
  /**
   * 获取通知列表
   */
  list: async (params?: NotificationsListParams): Promise<Notification[]> => {
    return api.get<Notification[]>('/notifications', params);
  },

  /**
   * 获取未读数量
   */
  getUnreadCount: async (): Promise<number> => {
    const result = await api.get<{ count: number }>('/notifications/unread-count');
    return result.count;
  },

  /**
   * 标记单条已读
   */
  markAsRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  },

  /**
   * 全部标记已读
   */
  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read');
  },
};
