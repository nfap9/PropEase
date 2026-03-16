import api from './client';

/** 通知项（与 API 返回一致） */
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type?: string | null;
  is_read: boolean;
  extra_data?: unknown;
  created_at: string;
  updated_at: string;
}

export interface UnreadCountResponse {
  count: number;
}

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
