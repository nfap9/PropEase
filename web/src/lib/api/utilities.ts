import api from './client';
import { UtilityReading } from '@/types';

export interface BatchUtilityReadingItem {
  room_id: string;  // ULID
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

export interface UtilityExportRoom {
  room_id: string;  // ULID
  apartment_name: string;
  room_number: string;
  tenant_name: string;
  billing_day: number;
  water_previous: number | null;
  electricity_previous: number | null;
}

export const utilitiesApi = {
  list: async (
    orgId: string,
    periodYear?: number,
    periodMonth?: number
  ): Promise<UtilityReading[]> => {
    const response = await api.get<UtilityReading[]>('/utilities', {
      params: {
        org_id: orgId,
        period_year: periodYear,
        period_month: periodMonth,
      },
    });
    return response.data;
  },

  get: async (orgId: string, id: string): Promise<UtilityReading> => {
    const response = await api.get<UtilityReading>(`/utilities/${id}`, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  create: async (orgId: string, data: Partial<UtilityReading>): Promise<UtilityReading> => {
    const response = await api.post<UtilityReading>('/utilities', data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  update: async (orgId: string, id: string, data: Partial<UtilityReading>): Promise<UtilityReading> => {
    const response = await api.put<UtilityReading>(`/utilities/${id}`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  delete: async (orgId: string, id: string): Promise<void> => {
    await api.delete(`/utilities/${id}`, { params: { org_id: orgId } });
  },

  batchCreate: async (
    orgId: string,
    data: BatchUtilityReadingData
  ): Promise<UtilityReading[]> => {
    const response = await api.post<UtilityReading[]>('/utilities/batch', data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  exportRooms: async (
    orgId: string,
    periodYear: number,
    periodMonth: number,
    daysRange?: number
  ): Promise<UtilityExportRoom[]> => {
    const response = await api.get<UtilityExportRoom[]>('/utilities/export', {
      params: {
        org_id: orgId,
        period_year: periodYear,
        period_month: periodMonth,
        days_range: daysRange,
      },
    });
    return response.data;
  },
};

export default utilitiesApi;
