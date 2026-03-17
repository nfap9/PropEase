import api from './client';
import {
  OrganizationSubscription,
  SubscriptionOrder,
  SubscriptionPlan,
  SubscribeRequest,
  SubscriptionStatus,
  OrganizationUsage,
} from '@/types';

/**
 * 定价折扣配置
 */
export interface PricingDiscount {
  months: number;
  discount_type: 'gift' | 'percent' | 'fixed';
  discount_value: number | null;
  gift_months: number | null;
}

/**
 * 商店服务定价
 */
export interface StorefrontServicePricing {
  id: string;
  service_id: string;
  months: number;
  price: number;
  discount_type: string | null;
  discount_value: number | null;
  discount_amount: number;
  final_price: number;
  gift_months: number;
  is_active: boolean;
  sort_order: number;
}

/**
 * 商店服务
 */
export interface StorefrontService {
  id: string;
  name: string;
  code: string;
  description: string | null;
  max_organizations: number | null;
  max_apartments: number;
  max_rooms: number;
  max_members: number;
  pricing: StorefrontServicePricing[];
}

/**
 * 商店视图
 */
export interface StorefrontView {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  is_default: boolean;
  services: StorefrontService[];
}

/**
 * 价格计算结果
 */
export interface PriceCalculationResult {
  original_price: number;
  final_price: number;
  discount_type: string | null;
  discount_value: number | null;
  discount_amount: number;
  gift_months: number;
}

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

  // Storefront
  getStorefront: async (storefrontId?: string): Promise<StorefrontView> => {
    const response = await api.get<StorefrontView>('/subscriptions/storefront', {
      params: storefrontId ? { storefront_id: storefrontId } : undefined,
    });
    return response.data;
  },

  calculatePrice: async (params: {
    service_id: string;
    months: number;
    storefront_id?: string;
  }): Promise<PriceCalculationResult> => {
    const response = await api.post<PriceCalculationResult>(
      '/subscriptions/storefront/calculate-price',
      params
    );
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

  cancelSubscription: async (orgId: string, reason?: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      `/subscriptions/organizations/${orgId}/subscription/cancel`,
      { reason }
    );
    return response.data;
  },

  // Orders
  createOrder: async (orgId: string, data: { plan_id: string; billing_months?: number }): Promise<SubscriptionOrder> => {
    const response = await api.post<SubscriptionOrder>(
      `/subscriptions/organizations/${orgId}/orders`,
      data
    );
    return response.data;
  },

  getOrder: async (orgId: string, orderId: string): Promise<SubscriptionOrder> => {
    const response = await api.get<SubscriptionOrder>(
      `/subscriptions/organizations/${orgId}/orders/${orderId}`
    );
    return response.data;
  },

  /** 开发环境模拟支付，仅当订单返回 simulate_pay_available 时可用 */
  simulatePay: async (orgId: string, orderId: string): Promise<SubscriptionOrder> => {
    const response = await api.post<SubscriptionOrder>(
      `/subscriptions/organizations/${orgId}/orders/${orderId}/simulate-pay`
    );
    return response.data;
  },
};

export default subscriptionsApi;
