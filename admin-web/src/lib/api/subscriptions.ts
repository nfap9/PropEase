import api from './client';
import {
  OrganizationSubscription,
  SubscriptionOrder,
  SubscriptionOrderCreate,
  SubscribeRequest,
  SubscriptionStatus,
} from '@/types';

export const subscriptionsApi = {
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

  subscribe: async (orgId: string, data: SubscribeRequest): Promise<OrganizationSubscription> => {
    const serviceId = 'service_id' in data && typeof data.service_id === 'string'
      ? data.service_id
      : data.plan_id;
    const billingMonths = data.billing_months ?? (data.billing_cycle === 'yearly' ? 12 : 1);
    const response = await api.post<OrganizationSubscription>(
      `/subscriptions/organizations/${orgId}/subscription`,
      {
        service_id: serviceId,
        billing_cycle: data.billing_cycle,
        billing_months: billingMonths,
        auto_renew: data.auto_renew,
      }
    );
    return response.data;
  },

  changePlan: async (
    orgId: string,
    data: {
      plan_id?: string;
      service_id?: string;
      billing_cycle?: string;
      billing_months?: number;
      effective?: 'immediate' | 'next_cycle';
    }
  ): Promise<OrganizationSubscription> => {
    const serviceId = data.service_id ?? data.plan_id;
    const response = await api.put<OrganizationSubscription>(
      `/subscriptions/organizations/${orgId}/subscription`,
      {
        service_id: serviceId,
        billing_cycle: data.billing_cycle,
        billing_months: data.billing_months,
        effective: data.effective,
      }
    );
    return response.data;
  },

  cancelSubscription: async (orgId: string, reason?: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      `/subscriptions/organizations/${orgId}/subscription/cancel`,
      { reason }
    );
    return response.data;
  },

  // 订阅支付订单（付费服务）
  createOrder: async (orgId: string, data: SubscriptionOrderCreate): Promise<SubscriptionOrder> => {
    const serviceId = 'service_id' in data && typeof data.service_id === 'string'
      ? data.service_id
      : data.plan_id;
    const billingMonths = data.billing_months ?? (data.billing_cycle === 'yearly' ? 12 : 1);
    const response = await api.post<SubscriptionOrder>(
      `/subscriptions/organizations/${orgId}/orders`,
      {
        service_id: serviceId,
        billing_months: billingMonths,
      }
    );
    return response.data;
  },

  getOrder: async (orgId: string, orderId: string): Promise<SubscriptionOrder> => {
    const response = await api.get<SubscriptionOrder>(
      `/subscriptions/organizations/${orgId}/orders/${orderId}`
    );
    return response.data;
  },

};

export default subscriptionsApi;
