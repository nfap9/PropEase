import api from './client';
import {
  OrganizationSubscription,
  SubscriptionOrder,
  SubscriptionOrderCreate,
  SubscriptionPlan,
  SubscribeRequest,
  SubscriptionStatus,
} from '@/types';

export const subscriptionsApi = {
  // Plans
  listPlans: async (activeOnly: boolean = true): Promise<SubscriptionPlan[]> => {
    const response = await api.get<SubscriptionPlan[]>('/subscriptions/plans', {
      params: { active_only: activeOnly },
    });
    return response.data;
  },

  getPlan: async (planId: string): Promise<SubscriptionPlan> => {
    const response = await api.get<SubscriptionPlan>(`/subscriptions/plans/${planId}`);
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

  subscribe: async (orgId: string, data: SubscribeRequest): Promise<OrganizationSubscription> => {
    const response = await api.post<OrganizationSubscription>(
      `/subscriptions/organizations/${orgId}/subscription`,
      data
    );
    return response.data;
  },

  changePlan: async (
    orgId: string,
    data: { plan_id: string; billing_cycle?: string }
  ): Promise<OrganizationSubscription> => {
    const response = await api.put<OrganizationSubscription>(
      `/subscriptions/organizations/${orgId}/subscription`,
      data
    );
    return response.data;
  },

  cancelSubscription: async (
    orgId: string,
    reason?: string
  ): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      `/subscriptions/organizations/${orgId}/subscription/cancel`,
      { reason }
    );
    return response.data;
  },

  // 订阅支付订单（付费套餐）
  createOrder: async (
    orgId: string,
    data: SubscriptionOrderCreate
  ): Promise<SubscriptionOrder> => {
    const response = await api.post<SubscriptionOrder>(
      `/subscriptions/organizations/${orgId}/orders`,
      { plan_id: data.plan_id, billing_cycle: data.billing_cycle ?? 'monthly' }
    );
    return response.data;
  },

  getOrder: async (
    orgId: string,
    orderId: string
  ): Promise<SubscriptionOrder> => {
    const response = await api.get<SubscriptionOrder>(
      `/subscriptions/organizations/${orgId}/orders/${orderId}`
    );
    return response.data;
  },

  /** 开发环境模拟支付，仅当订单返回 simulate_pay_available 时可用 */
  simulatePay: async (
    orgId: string,
    orderId: string
  ): Promise<SubscriptionOrder> => {
    const response = await api.post<SubscriptionOrder>(
      `/subscriptions/organizations/${orgId}/orders/${orderId}/simulate-pay`
    );
    return response.data;
  },
};

export default subscriptionsApi;
