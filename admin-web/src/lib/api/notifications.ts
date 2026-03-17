import type { Notification, UnreadCountResponse } from '@apartment-ultra/api-contract';
import api from './client';

export type { Notification };

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data.count;
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read');
  },

  markRead: async (id: string): Promise<void> => {
    await api.post(`/notifications/${id}/read`);
  },
};

export default notificationsApi;
