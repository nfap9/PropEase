import api from './client';
import type { UsagePricing, BillingOrder } from '@apartment-ultra/api-contract';

export const usageApi = {
  getPricing: (): Promise<UsagePricing> =>
    api.get<UsagePricing>('/usage/pricing').then((r) => r.data),

  getQuota: (): Promise<{ orgs: number; apartments: number; rooms: number; members: number }> =>
    api.get<{ orgs: number; apartments: number; rooms: number; members: number }>('/usage/quota').then((r) => r.data),

  createOrder: (data: {
    orgs: number;
    apartments: number;
    rooms: number;
    members: number;
  }): Promise<BillingOrder> =>
    api.post<BillingOrder>('/usage/orders', data).then((r) => r.data),

  getOrder: (orderId: string): Promise<BillingOrder> =>
    api.get<BillingOrder>(`/usage/orders/${orderId}`).then((r) => r.data),
};
