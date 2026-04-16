/**
 * 用量付费模块 - 统一订单类型定义
 */

/** 统一订单类型 */
export type BillingOrderType = 'subscription' | 'usage';

/** 订单状态 */
export type BillingOrderStatus = 'pending' | 'paid' | 'cancelled' | 'expired';

/** 用量明细 */
export interface BillingUsageDetails {
  orgs: number;
  apartments: number;
  rooms: number;
  members: number;
}

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
  usage_details: BillingUsageDetails | null;
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

/** 创建用量订单请求 */
export interface CreateUsageOrderRequest {
  order_type: 'usage';
  organization_id: string;
  usage_details: BillingUsageDetails;
}

/** 创建订单请求 */
export type CreateBillingOrderRequest = CreateSubscriptionOrderRequest | CreateUsageOrderRequest;

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

/** 用量单价信息 */
export interface UsageUnitPricing {
  unit_type: 'org' | 'apartment' | 'room' | 'member';
  price_per_unit: number;
  is_active: boolean;
}

/** 用量单价响应（平面结构） */
export interface AdminUsagePricingResponse {
  price_per_org: number;
  price_per_apartment: number;
  price_per_room: number;
  price_per_member: number;
}

/** 用量单价更新请求 */
export interface AdminUsagePricingUpdateRequest {
  price_per_org?: number;
  price_per_apartment?: number;
  price_per_room?: number;
  price_per_member?: number;
}
