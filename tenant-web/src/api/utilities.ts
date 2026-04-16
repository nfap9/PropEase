import api from './client';
import { UtilityReading } from '@/types';
import type {
  BatchUtilityReadingData,
  RoomMissingInitialReading,
  UtilityExportRoom,
} from '@apartment-ultra/api-contract';

export type UtilityReadingMutationData = Partial<UtilityReading> & {
  reading_context?: 'normal' | 'initial' | 'meter_reset';
  anomaly_reason?: string;
};

export type { BatchUtilityReadingData, RoomMissingInitialReading, UtilityExportRoom };

export const utilitiesApi = {
  list: async (
    orgId: string,
    filters?: {
      room_id?: string;
      period_year?: number;
      period_month?: number;
      apartment_id?: string | null;
    }
  ): Promise<UtilityReading[]> => {
    const { room_id, period_year, period_month, apartment_id } = filters ?? {};
    const response = await api.get<UtilityReading[]>('/utilities', {
      params: {
        org_id: orgId,
        room_id: room_id || undefined,
        period_year: period_year ?? undefined,
        period_month: period_month ?? undefined,
        apartment_id: apartment_id || undefined,
      },
    });
    return response.data;
  },

  getLatestBefore: async (
    orgId: string,
    periodYear: number,
    periodMonth: number
  ): Promise<Record<string, UtilityReading>> => {
    const response = await api.get<Record<string, UtilityReading>>('/utilities/latest-before', {
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

  create: async (orgId: string, data: UtilityReadingMutationData): Promise<UtilityReading> => {
    const response = await api.post<UtilityReading>('/utilities', data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  update: async (
    orgId: string,
    id: string,
    data: UtilityReadingMutationData
  ): Promise<UtilityReading> => {
    const response = await api.put<UtilityReading>(`/utilities/${id}`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  delete: async (orgId: string, id: string): Promise<void> => {
    await api.delete(`/utilities/${id}`, { params: { org_id: orgId } });
  },

  batchCreate: async (orgId: string, data: BatchUtilityReadingData): Promise<UtilityReading[]> => {
    const response = await api.post<UtilityReading[]>('/utilities/batch', data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  getRoomsMissingInitial: async (orgId: string): Promise<RoomMissingInitialReading[]> => {
    const response = await api.get<RoomMissingInitialReading[]>(
      '/utilities/rooms-missing-initial',
      {
        params: { org_id: orgId },
      }
    );
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
