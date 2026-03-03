import api from './client';
import { Bill, Payment, BillStatus } from '@/types';

export const billsApi = {
  list: async (
    orgId: string,
    filters?: { lease_id?: string; year?: number; month?: number; status?: BillStatus }
  ): Promise<Bill[]> => {
    const response = await api.get<Bill[]>('/bills', {
      params: { org_id: orgId, ...filters },
    });
    return response.data;
  },

  get: async (orgId: string, id: string): Promise<Bill> => {
    const response = await api.get<Bill>(`/bills/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: string, data: Partial<Bill>): Promise<Bill> => {
    const response = await api.post<Bill>('/bills', data, { params: { org_id: orgId } });
    return response.data;
  },

  update: async (orgId: string, id: string, data: Partial<Bill>): Promise<Bill> => {
    const response = await api.put<Bill>(`/bills/${id}`, data, { params: { org_id: orgId } });
    return response.data;
  },

  generate: async (
    orgId: string,
    data: { bill_year: number; bill_month: number; due_date: string; lease_ids?: string[] }
  ): Promise<{ created: number; skipped: number }> => {
    const response = await api.post<{ created: number; skipped: number }>('/bills/generate', data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  getPayments: async (orgId: string, billId: string): Promise<Payment[]> => {
    const response = await api.get<Payment[]>(`/bills/${billId}/payments`, { params: { org_id: orgId } });
    return response.data;
  },

  createPayment: async (orgId: string, billId: string, data: Partial<Payment>): Promise<Payment> => {
    const response = await api.post<Payment>(`/bills/${billId}/payments`, data, { params: { org_id: orgId } });
    return response.data;
  },

  exportPdf: async (orgId: string, billId: string): Promise<Blob> => {
    const response = await api.get(`/bills/${billId}/pdf`, {
      params: { org_id: orgId },
      responseType: 'blob',
    });
    return response.data;
  },

  exportExcel: async (orgId: string, filters?: { status?: BillStatus; year?: number; month?: number; exportType?: 'all' | 'unfinished' }): Promise<Blob> => {
    const response = await api.get('/bills/export/excel', {
      params: { org_id: orgId, ...filters },
      responseType: 'blob',
    });
    return response.data;
  },
};

export default billsApi;
