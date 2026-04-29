import api from './client';
import {
  OrganizationSubscription,
  BillingOrder,
  SubscribeRequest,
  SubscriptionStatus,
  OrganizationUsage,
  ServiceProduct,
  ServicePricing,
} from '@/types';


export const subscriptionsApi = {
  // Services
  getServices: async (): Promise<ServiceProduct[]> => {
    const response = await api.get<ServiceProduct[]>('/subscriptions/services');
    return response.data;
  },

  // Organization Subscription
  getSubscription: async (orgId: string): Promise<OrganizationSubscription> => {
    const response = await api.get<OrganizationSubscription>(
      `/subscriptions/organizations/${orgId}/subscription`
    );
    return response.data;
  },

  getSubscriptionStatus: async (orgId: string): Promise<SubscriptionStatus> => {
    const response = await api.get<SubscriptionStatus>(
      `/subscriptions/organizations/${orgId}/subscription/status`
    );
    return response.data;
  },

  getUsage: async (orgId: string): Promise<OrganizationUsage> => {
    const response = await api.get<OrganizationUsage>(
      `/organizations/${orgId}/usage`
    );
    return response.data;
  },

  subscribe: async (orgId: string, data: SubscribeRequest): Promise<OrganizationSubscription> => {
    const response = await api.post<OrganizationSubscription>(
      `/subscriptions/organizations/${orgId}/subscription`,
      data
    );
    return response.data;
  },

  // Orders
  createOrder: async (orgId: string, data: { service_id: string; billing_months?: number }): Promise<BillingOrder> => {
    const response = await api.post<BillingOrder>(
      `/subscriptions/organizations/${orgId}/orders`,
      data
    );
    return response.data;
  },

  getOrder: async (orgId: string, orderId: string): Promise<BillingOrder> => {
    const response = await api.get<BillingOrder>(
      `/subscriptions/organizations/${orgId}/orders/${orderId}`
    );
    return response.data;
  },

  previewOrder: async (orgId: string, data: { service_id: string; billing_months?: number }): Promise<{
    action_type: 'purchase' | 'renew' | 'upgrade' | 'downgrade';
    service_name: string;
    current_service_name: string | null;
    original_price: number;
    credit: number;
    final_price: number;
    billing_months: number;
  }> => {
    const response = await api.post(`/subscriptions/organizations/${orgId}/orders/preview`, {
      service_id: data.service_id,
      billing_months: data.billing_months ?? 1,
    });
    return response.data;
  },

  simulatePay: async (orgId: string, orderId: string): Promise<{ message: string; order_id: string }> => {
    const response = await api.post<{ message: string; order_id: string }>(
      `/subscriptions/organizations/${orgId}/orders/${orderId}/simulate-pay`
    );
    return response.data;
  },
};

export default subscriptionsApi;
