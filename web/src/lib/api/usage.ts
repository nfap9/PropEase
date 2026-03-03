import api from './client';

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
  simulate_pay_available?: boolean;
}

export const usageApi = {
  getPricing: (): Promise<UsagePricing> =>
    api.get<UsagePricing>('/usage/pricing').then((r) => r.data),

  getQuota: (): Promise<UsageQuota> =>
    api.get<UsageQuota>('/usage/quota').then((r) => r.data),

  createOrder: (data: {
    orgs: number;
    apartments: number;
    rooms: number;
    members: number;
  }): Promise<UsageQuotaOrder> =>
    api.post<UsageQuotaOrder>('/usage/orders', data).then((r) => r.data),

  getOrder: (orderId: string): Promise<UsageQuotaOrder> =>
    api.get<UsageQuotaOrder>(`/usage/orders/${orderId}`).then((r) => r.data),

  simulatePay: (orderId: string): Promise<UsageQuotaOrder> =>
    api.post<UsageQuotaOrder>(`/usage/orders/${orderId}/simulate-pay`).then((r) => r.data),
};
