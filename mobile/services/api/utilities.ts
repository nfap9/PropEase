import api from './client'
import type {
  Apartment,
  BatchUtilityReadingData,
  Room,
  RoomMissingInitialReading,
  UtilityExportRoom,
  UtilityListParams,
  UtilityReadingCreate,
  UtilityReadingUpdate,
  UtilityReading,
} from '@apartment-ultra/api-contract'

export type { UtilityExportRoom };
export type { UtilityListParams };

export interface UtilityWithDetails extends UtilityReading {
  room?: Room & { apartment?: Apartment }
}

export const utilitiesApi = {
  /**
   * 获取水电读数列表
   */
  list: async (params?: UtilityListParams): Promise<UtilityWithDetails[]> => {
    return api.get<UtilityWithDetails[]>('/utilities', params as Record<string, unknown>)
  },

  /**
   * 获取水电读数详情
   */
  get: async (id: string): Promise<UtilityWithDetails> => {
    return api.get<UtilityWithDetails>(`/utilities/${id}`)
  },

  /**
   * 创建水电读数
   */
  create: async (data: UtilityReadingCreate): Promise<UtilityReading> => {
    return api.post<UtilityReading>('/utilities', data)
  },

  /**
   * 批量创建水电读数
   */
  batchCreate: async (data: BatchUtilityReadingData): Promise<UtilityReading[]> => {
    return api.post<UtilityReading[]>('/utilities/batch', data)
  },

  /**
   * 更新水电读数
   */
  update: async (id: string, data: UtilityReadingUpdate): Promise<UtilityReading> => {
    return api.put<UtilityReading>(`/utilities/${id}`, data)
  },

  /**
   * 删除水电读数
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/utilities/${id}`)
  },

  /**
   * 获取缺少初始读数的房间
   */
  getRoomsWithoutInitialReading: async (apartmentId?: string): Promise<RoomMissingInitialReading[]> => {
    return api.get<RoomMissingInitialReading[]>(
      '/utilities/rooms-missing-initial',
      apartmentId ? { apartment_id: apartmentId } as Record<string, unknown> : undefined
    )
  },

  exportRooms: async (
    periodYear: number,
    periodMonth: number,
    daysRange?: number
  ): Promise<UtilityExportRoom[]> => {
    return api.get<UtilityExportRoom[]>('/utilities/export', {
      period_year: periodYear,
      period_month: periodMonth,
      days_range: daysRange,
    })
  },
}

export default utilitiesApi
