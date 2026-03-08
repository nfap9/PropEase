import api from './client';
import type { Bill, BillCreate, Payment, PaymentCreate } from '@apartment-ultra/api-contract';

export interface BillsListParams {
  org_id: string;
  status?: string;
  apartment_id?: string;
  tenant_id?: string;
  year_month?: string;
}

export const billsApi = {
  /**
   * 获取账单列表
   */
  list: async (params: BillsListParams): Promise<Bill[]> => {
    return api.get<Bill[]>('/bills', params);
  },

  /**
   * 获取账单详情
   */
  get: async (id: string): Promise<Bill> => {
    return api.get<Bill>(`/bills/${id}`);
  },

  /**
   * 创建账单
   */
  create: async (data: BillCreate): Promise<Bill> => {
    return api.post<Bill>('/bills', data);
  },

  /**
   * 更新账单
   */
  update: async (id: string, data: Partial<BillCreate>): Promise<Bill> => {
    return api.put<Bill>(`/bills/${id}`, data);
  },

  /**
   * 删除账单
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/bills/${id}`);
  },

  /**
   * 获取账单付款记录
   */
  getPayments: async (billId: string): Promise<Payment[]> => {
    return api.get<Payment[]>(`/bills/${billId}/payments`);
  },

  /**
   * 添加付款记录（登记收款）
   */
  addPayment: async (billId: string, data: PaymentCreate): Promise<Payment> => {
    return api.post<Payment>(`/bills/${billId}/payments`, data);
  },
};
