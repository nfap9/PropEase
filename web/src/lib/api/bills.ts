import api from './client';
import { Bill, Payment, BillStatus } from '@/types';

export const billsApi = {
  list: async (orgId: number, filters?: { year?: number; month?: number; status?: BillStatus }): Promise<Bill[]> => {
    const response = await api.get<Bill[]>('/bills', {
      params: { org_id: orgId, ...filters },
    });
    return response.data;
  },

  get: async (orgId: number, id: number): Promise<Bill> => {
    const response = await api.get<Bill>(`/bills/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: number, data: Partial<Bill>): Promise<Bill> => {
    const response = await api.post<Bill>('/bills', data, { params: { org_id: orgId } });
    return response.data;
  },

  update: async (orgId: number, id: number, data: Partial<Bill>): Promise<Bill> => {
    const response = await api.put<Bill>(`/bills/${id}`, data, { params: { org_id: orgId } });
    return response.data;
  },

  generate: async (orgId: number, data: { bill_year: number; bill_month: number; due_date: string }): Promise<{ created: number; skipped: number }> => {
    const response = await api.post<{ created: number; skipped: number }>('/bills/generate', data, { params: { org_id: orgId } });
    return response.data;
  },

  getPayments: async (orgId: number, billId: number): Promise<Payment[]> => {
    const response = await api.get<Payment[]>(`/bills/${billId}/payments`, { params: { org_id: orgId } });
    return response.data;
  },

  createPayment: async (orgId: number, billId: number, data: Partial<Payment>): Promise<Payment> => {
    const response = await api.post<Payment>(`/bills/${billId}/payments`, data, { params: { org_id: orgId } });
    return response.data;
  },

  exportPdf: async (orgId: number, billId: number): Promise<Blob> => {
    const response = await api.get(`/bills/${billId}/pdf`, {
      params: { org_id: orgId },
      responseType: 'blob',
    });
    return response.data;
  },
};

export default billsApi;
