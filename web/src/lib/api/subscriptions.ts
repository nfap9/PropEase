import api from './client';
import {
  SubscriptionPlan,
  OrganizationSubscription,
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
};

export default subscriptionsApi;
