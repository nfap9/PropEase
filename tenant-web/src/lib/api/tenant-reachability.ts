import type {
  NotificationDeliveryStatus,
  TenantNotificationDelivery,
  TenantNotificationTemplate,
  TenantReachabilityEventType,
} from '@apartment-ultra/api-contract';
import api from './client';

export const tenantReachabilityApi = {
  listTemplates: async (orgId: string): Promise<TenantNotificationTemplate[]> => {
    const response = await api.get<TenantNotificationTemplate[]>('/tenant-reachability/templates', {
      params: { org_id: orgId },
    });
    return response.data;
  },

  updateTemplate: async (
    orgId: string,
    eventType: TenantReachabilityEventType,
    data: { content: string; is_enabled: boolean }
  ): Promise<TenantNotificationTemplate> => {
    const response = await api.put<TenantNotificationTemplate>(
      `/tenant-reachability/templates/${eventType}`,
      data,
      {
        params: { org_id: orgId },
      }
    );
    return response.data;
  },

  listDeliveries: async (
    orgId: string,
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
        params: { org_id: orgId, ...filters },
      }
    );
    return response.data;
  },
};

export default tenantReachabilityApi;
