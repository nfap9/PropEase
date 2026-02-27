import api from './client';
import { UtilityReading } from '@/types';

export interface BatchUtilityReadingItem {
  room_id: number;
  water_reading?: number | null;
  electricity_reading?: number | null;
  notes?: string | null;
}

export interface BatchUtilityReadingData {
  period_year: number;
  period_month: number;
  reading_date: string;
  readings: BatchUtilityReadingItem[];
}

export const utilitiesApi = {
  list: async (orgId: number): Promise<UtilityReading[]> => {
    const response = await api.get<UtilityReading[]>('/utilities', {
      params: { org_id: orgId },
    });
    return response.data;
  },

  get: async (orgId: number, id: number): Promise<UtilityReading> => {
    const response = await api.get<UtilityReading>(`/utilities/${id}`, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  create: async (orgId: number, data: Partial<UtilityReading>): Promise<UtilityReading> => {
    const response = await api.post<UtilityReading>('/utilities', data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  update: async (orgId: number, id: number, data: Partial<UtilityReading>): Promise<UtilityReading> => {
    const response = await api.put<UtilityReading>(`/utilities/${id}`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  delete: async (orgId: number, id: number): Promise<void> => {
    await api.delete(`/utilities/${id}`, { params: { org_id: orgId } });
  },

  batchCreate: async (
    orgId: number,
    data: BatchUtilityReadingData
  ): Promise<UtilityReading[]> => {
    const response = await api.post<UtilityReading[]>('/utilities/batch', data, {
      params: { org_id: orgId },
    });
    return response.data;
  },
};

export default utilitiesApi;
