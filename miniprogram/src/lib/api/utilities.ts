import api from './client';
import type { UtilityReading, UtilityReadingCreate } from '@apartment-ultra/api-contract';

export interface UtilitiesListParams {
  org_id: string;
  apartment_id?: string;
  room_id?: string;
  year_month?: string;
}

export const utilitiesApi = {
  /**
   * 获取抄表记录列表
   */
  list: async (params: UtilitiesListParams): Promise<UtilityReading[]> => {
    return api.get<UtilityReading[]>('/utilities', params);
  },

  /**
   * 获取单条抄表记录
   */
  get: async (id: string): Promise<UtilityReading> => {
    return api.get<UtilityReading>(`/utilities/${id}`);
  },

  /**
   * 创建抄表记录
   */
  create: async (data: UtilityReadingCreate): Promise<UtilityReading> => {
    return api.post<UtilityReading>('/utilities', data);
  },

  /**
   * 更新抄表记录
   */
  update: async (id: string, data: Partial<UtilityReadingCreate>): Promise<UtilityReading> => {
    return api.put<UtilityReading>(`/utilities/${id}`, data);
  },

  /**
   * 删除抄表记录
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/utilities/${id}`);
  },

  /**
   * 批量创建抄表记录
   */
  batchCreate: async (data: UtilityReadingCreate[]): Promise<UtilityReading[]> => {
    return api.post<UtilityReading[]>('/utilities/batch', data);
  },
};
