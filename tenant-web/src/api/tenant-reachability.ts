import type {
  NotificationDeliveryStatus,
  TenantNotificationDelivery,
  TenantNotificationTemplate,
  TenantReachabilityEventType,
} from '@apartment-ultra/api-contract';
import api from './client';

export const tenantReachabilityApi = {
  listTemplates: async (): Promise<TenantNotificationTemplate[]> => {
    const response = await api.get<TenantNotificationTemplate[]>('/tenant-reachability/templates');
    return response.data;
  },

  updateTemplate: async (
    eventType: TenantReachabilityEventType,
    data: { content: string; is_enabled: boolean }
  ): Promise<TenantNotificationTemplate> => {
    const response = await api.put<TenantNotificationTemplate>(
      `/tenant-reachability/templates/${eventType}`,
      data
    );
    return response.data;
  },

  listDeliveries: async (
    filters?: {
      status?: NotificationDeliveryStatus | 'all';
      event_type?: TenantReachabilityEventType | 'all';
      tenant_id?: string;
      limit?: number;
    }
  ): Promise<TenantNotificationDelivery[]> => {
    const response = await api.get<TenantNotificationDelivery[]>(
      '/tenant-reachability/deliveries',
      {
        params: { ...filters },
      }
    );
    return response.data;
  },
};

export default tenantReachabilityApi;
