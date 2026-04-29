/**
 * 订单模块 - 统一订单类型定义
 */

/** 统一订单类型 */
export type BillingOrderType = 'subscription';

/** 订单状态 */
export type BillingOrderStatus = 'pending' | 'paid' | 'cancelled' | 'expired';

/** 统一订单 */
export interface BillingOrder {
  id: string;
  order_no: string;
  order_type: BillingOrderType;
  organization_id: string | null;
  user_id: string | null;
  service_id: string | null;
  pricing_id: string | null;
  billing_months: number | null;
  amount: number;
  original_amount: number | null;
  currency: string;
  status: BillingOrderStatus;
  payment_method: string;
  code_url: string | null;
  wechat_transaction_id: string | null;
  paid_at: string | null;
  expires_at: string;
  created_at: string;
}

/** 创建订阅订单请求 */
export interface CreateSubscriptionOrderRequest {
  order_type: 'subscription';
  organization_id: string;
  service_id: string;
  pricing_id?: string;
  billing_months?: number;
}

/** 创建订单请求 */
export type CreateBillingOrderRequest = CreateSubscriptionOrderRequest;

/** 订单列表查询参数 */
export interface BillingOrderListParams {
  order_type?: BillingOrderType;
  organization_id?: string;
  status?: BillingOrderStatus;
  limit?: number;
  offset?: number;
}

/** 订单列表响应 */
export interface BillingOrderListResponse {
  orders: BillingOrder[];
  total: number;
  limit: number;
  offset: number;
}


