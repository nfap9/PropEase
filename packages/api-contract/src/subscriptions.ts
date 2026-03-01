/** 订阅计划 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_apartments: number;
  max_rooms: number;
  max_members: number;
  features: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** 组织订阅 */
export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  billing_cycle: 'monthly' | 'yearly';
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
  billing_cycle: 'monthly' | 'yearly';
  auto_renew?: boolean;
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

/** 订阅订单 */
export interface SubscriptionOrder {
  id: string;
  order_no: string;
  organization_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: SubscriptionOrderStatus;
  code_url: string | null;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
}

/** 创建订阅订单 */
export interface SubscriptionOrderCreate {
  plan_id: string;
  billing_cycle?: 'monthly' | 'yearly';
}
