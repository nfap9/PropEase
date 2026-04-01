export interface UsagePricing {
  price_per_org: number;
  price_per_apartment: number;
  price_per_room: number;
  price_per_member: number;
}

export interface UsageQuota {
  orgs: number;
  apartments: number;
  rooms: number;
  members: number;
}

export interface UsageQuotaOrder {
  id: string;
  order_no: string;
  user_id: string;
  orgs: number;
  apartments: number;
  rooms: number;
  members: number;
  amount: number;
  status: string;
  code_url: string | null;
  expires_at: string;
  paid_at: string | null;
  /** 开发环境且无 code_url 时为 true，表示可调用模拟支付接口（向后兼容） */
  simulate_pay_available?: boolean;
}
