import api from './client';
import type { UsagePricing, UsageQuota, UsageQuotaOrder } from '@apartment-ultra/api-contract';

export const usageApi = {
  getPricing: (): Promise<UsagePricing> =>
    api.get<UsagePricing>('/usage/pricing').then((r) => r.data),

  getQuota: (): Promise<UsageQuota> => api.get<UsageQuota>('/usage/quota').then((r) => r.data),

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
