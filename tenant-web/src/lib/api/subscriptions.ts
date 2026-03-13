import api from './client';
import {
  OrganizationSubscription,
  SubscriptionOrder,
  SubscriptionOrderCreate,
  SubscriptionPlan,
  SubscribeRequest,
  SubscriptionStatus,
  OrganizationUsage,
} from '@/types';

/**
 * 优惠码验证结果
 */
export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  promotion?: {
    id: string;
    name: string;
    type: string;
    discount_value: number | null;
    gift_months: number | null;
  };
}

/**
 * 价格计算结果
 */
export interface PriceCalculationResult {
  original_price: number;
  final_price: number;
  total_discount: number;
  total_gift_months: number;
  balance_deduction: number;
  applied_promotions: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    discount_amount: number;
    gift_months: number;
    balance_deduction: number;
  }>;
  balance_available: number;
  coupon_valid: boolean;
  coupon_message?: string;
  referral_valid: boolean;
  referral_message?: string;
}

/**
 * 可用优惠列表
 */
export interface AvailablePromotionsResult {
  promotions: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    discount_value: number | null;
    gift_months: number | null;
    is_stackable: boolean;
  }>;
  balance_available: number;
}

/**
 * 推荐码信息
 */
export interface ReferralCodeResult {
  referral_code: string;
  stats: {
    total_referrals: number;
    completed_referrals: number;
    pending_referrals: number;
    total_rewards_earned: number;
    total_rewards_pending: number;
  };
}

/**
 * 余额信息
 */
export interface BalanceResult {
  balance: number;
  total_gifted: number;
  total_used: number;
  available_gift_months: number;
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

  // 订阅支付订单（付费套餐）
  createOrder: async (orgId: string, data: SubscriptionOrderCreate & { billing_months?: number }): Promise<SubscriptionOrder> => {
    const response = await api.post<SubscriptionOrder>(
      `/subscriptions/organizations/${orgId}/orders`,
      {
        plan_id: data.plan_id,
        billing_cycle: data.billing_cycle ?? 'monthly',
        billing_months: data.billing_months,
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

  /** 开发环境模拟支付，仅当订单返回 simulate_pay_available 时可用 */
  simulatePay: async (orgId: string, orderId: string): Promise<SubscriptionOrder> => {
    const response = await api.post<SubscriptionOrder>(
      `/subscriptions/organizations/${orgId}/orders/${orderId}/simulate-pay`
    );
    return response.data;
  },

  // ========== 优惠相关 API ==========

  /** 验证优惠码 */
  validateCoupon: async (params: {
    code: string;
    plan_id: string;
    organization_id: string;
    amount: number;
  }): Promise<CouponValidationResult> => {
    const response = await api.post<CouponValidationResult>(
      '/subscriptions/validate-coupon',
      params
    );
    return response.data;
  },

  /** 获取可用优惠 */
  getAvailablePromotions: async (orgId: string, planId: string): Promise<AvailablePromotionsResult> => {
    const response = await api.get<AvailablePromotionsResult>(
      `/subscriptions/organizations/${orgId}/available-promotions`,
      { params: { plan_id: planId } }
    );
    return response.data;
  },

  /** 计算价格 */
  calculatePrice: async (params: {
    plan_id: string;
    billing_months: number;
    organization_id: string;
    coupon_code?: string;
    use_balance?: boolean;
    referral_code?: string;
  }): Promise<PriceCalculationResult> => {
    const response = await api.post<PriceCalculationResult>(
      '/subscriptions/calculate-price',
      params
    );
    return response.data;
  },

  /** 获取推荐码 */
  getMyReferralCode: async (): Promise<ReferralCodeResult> => {
    const response = await api.get<ReferralCodeResult>('/subscriptions/referrals/my-code');
    return response.data;
  },

  /** 获取余额 */
  getBalance: async (orgId: string): Promise<BalanceResult> => {
    const response = await api.get<BalanceResult>(
      `/subscriptions/organizations/${orgId}/balance`
    );
    return response.data;
  },

  /** 创建订单（增强版，支持优惠） */
  createOrderWithPromotions: async (
    orgId: string,
    data: SubscriptionOrderCreate & {
      billing_months?: number;
      coupon_code?: string;
      use_balance?: boolean;
      referral_code?: string;
    }
  ): Promise<SubscriptionOrder & { promotion_details?: PriceCalculationResult }> => {
    const response = await api.post<SubscriptionOrder & { promotion_details?: PriceCalculationResult }>(
      `/subscriptions/organizations/${orgId}/orders`,
      data
    );
    return response.data;
  },
};

export default subscriptionsApi;
