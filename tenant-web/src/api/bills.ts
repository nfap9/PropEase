import api from './client';
import { Bill, Payment, BillStatus } from '@/types';
import type { BillFeeItem } from '@/types';

export const billsApi = {
  list: async (
    filters?: { lease_id?: string; year?: number; month?: number; status?: BillStatus }
  ): Promise<Bill[]> => {
    const response = await api.get<Bill[]>('/bills', {
      params: { ...filters },
    });
    return response.data;
  },

  get: async (id: string): Promise<Bill> => {
    const response = await api.get<Bill>(`/bills/${id}`);
    return response.data;
  },

  create: async (data: Partial<Bill>): Promise<Bill> => {
    const response = await api.post<Bill>('/bills', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Bill>): Promise<Bill> => {
    const response = await api.put<Bill>(`/bills/${id}`, data);
    return response.data;
  },

  generate: async (
    data: { bill_year: number; bill_month: number; due_date: string; lease_ids?: string[] }
  ): Promise<{ created: number; skipped: number }> => {
    const response = await api.post<{ created: number; skipped: number }>('/bills/generate', data);
    return response.data;
  },

  getPayments: async (billId: string): Promise<Payment[]> => {
    const response = await api.get<Payment[]>(`/bills/${billId}/payments`);
    return response.data;
  },

  createPayment: async (
    billId: string,
    data: Partial<Payment>
  ): Promise<Payment> => {
    const response = await api.post<Payment>(`/bills/${billId}/payments`, data);
    return response.data;
  },

  exportPdf: async (billId: string): Promise<Blob> => {
    const response = await api.get(`/bills/${billId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportExcel: async (
    filters?: {
      status?: BillStatus;
      year?: number;
      month?: number;
      exportType?: 'all' | 'unfinished';
    }
  ): Promise<Blob> => {
    const response = await api.post('/bills/export', filters || {}, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const billFeeItemsApi = {
  list: async (billId: string): Promise<BillFeeItem[]> => {
    const response = await api.get<BillFeeItem[]>(`/bills/${billId}/fee-items`);
    return response.data;
  },
};

export default billsApi;
