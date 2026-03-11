import type { PlanPricing } from './promotion.js';

/** 订阅计划 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  /** 用户最多可拥有的组织数，null 表示不限制 */
  max_organizations: number | null;
  max_apartments: number;
  max_rooms: number;
  max_members: number;
  features: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
  /** 已废弃，保留向后兼容 */
  free_validity_days?: number | null;
  created_at: string;
  updated_at: string;
  /** 周期定价列表（可选，查询时返回） */
  pricing?: PlanPricing[];
}

/** 组织订阅 */
export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  billing_cycle: 'monthly' | 'yearly';
  /** 订阅月数 */
  billing_months: number;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

/** 订阅请求 */
export interface SubscribeRequest {
  plan_id: string;
  billing_cycle?: 'monthly' | 'yearly';
  /** 购买月数（默认1） */
  billing_months?: number;
  auto_renew?: boolean;
  /** 优惠活动 ID（可选） */
  promotion_id?: string;
}

/** 订阅状态 */
export interface SubscriptionStatus {
  has_subscription: boolean;
  plan: SubscriptionPlan | null;
  status: string;
  is_active: boolean;
  end_date: string | null;
  auto_renew: boolean;
  days_remaining: number | null;
}

/** 订阅订单状态 */
export type SubscriptionOrderStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

/** 订阅订单（GET 订单详情时可能包含 plan） */
export interface SubscriptionOrder {
  id: string;
  order_no: string;
  organization_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  /** 购买的月数 */
  billing_months: number;
  /** 优惠后金额 */
  amount: number;
  /** 原价（优惠前） */
  original_amount: number | null;
  currency: string;
  status: SubscriptionOrderStatus;
  code_url: string | null;
  expires_at: string;
  paid_at: string | null;
  /** 优惠活动 ID */
  promotion_id: string | null;
  created_at: string;
  /** 订单详情接口返回时包含套餐信息 */
  plan?: SubscriptionPlan | null;
  /** 优惠活动信息（可选） */
  promotion?: { id: string; name: string; type: string } | null;
  /** 开发环境且无 code_url 时为 true，表示可调用模拟支付接口 */
  simulate_pay_available?: boolean;
}

/** 创建订阅订单 */
export interface SubscriptionOrderCreate {
  plan_id: string;
  billing_cycle?: 'monthly' | 'yearly';
  /** 购买月数（默认1） */
  billing_months?: number;
  /** 优惠活动 ID（可选） */
  promotion_id?: string;
}

/** 使用量统计项 */
export interface UsageQuotaItem {
  /** 配置上限，-1 表示无限制 */
  limit: number;
  /** 已使用量 */
  used: number;
  /** 剩余量，-1 表示无限制 */
  remaining: number;
}

/** 组织使用量统计 */
export interface OrganizationUsageStats {
  /** 套餐配额使用情况 */
  plan_quotas: {
    apartments: UsageQuotaItem;
    rooms: UsageQuotaItem;
    members: UsageQuotaItem;
  };
  /** 按量付费额度（如有） */
  paid_quotas: {
    apartments: number;
    rooms: number;
    members: number;
    valid_from: string | null;
    valid_to: string | null;
  } | null;
}
