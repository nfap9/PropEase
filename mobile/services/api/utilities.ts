import api from './client'
import type { Apartment, Room, UtilityReading } from '@apartment-ultra/api-contract'

// 内部定义创建/更新数据类型
export interface CreateUtilityReadingData {
  room_id: string
  period_year: number
  period_month: number
  reading_date: string
  water_reading?: number
  electricity_reading?: number
  water_previous?: number
  electricity_previous?: number
  notes?: string
}

export interface UpdateUtilityReadingData {
  reading_date?: string
  water_reading?: number
  electricity_reading?: number
  water_previous?: number
  electricity_previous?: number
  notes?: string
}

export interface UtilityListParams {
  apartment_id?: string
  room_id?: string
  period_year?: number
  period_month?: number
  page?: number
  limit?: number
}

export interface UtilityWithDetails extends UtilityReading {
  room?: Room & { apartment?: Apartment }
}

export interface UtilityExportRoom {
  room_id: string
  apartment_id: string
  apartment_name: string
  room_number: string
  tenant_name: string
  tenant_phone: string
  billing_day: number
  water_previous: number | null
  electricity_previous: number | null
  water_unit_price: number | null
  electricity_unit_price: number | null
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
  create: async (data: CreateUtilityReadingData): Promise<UtilityReading> => {
    return api.post<UtilityReading>('/utilities', data)
  },

  /**
   * 批量创建水电读数
   */
  batchCreate: async (readings: CreateUtilityReadingData[]): Promise<UtilityReading[]> => {
    return api.post<UtilityReading[]>('/utilities/batch', { readings })
  },

  /**
   * 更新水电读数
   */
  update: async (id: string, data: UpdateUtilityReadingData): Promise<UtilityReading> => {
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
  getRoomsWithoutInitialReading: async (apartmentId?: string): Promise<{ room_id: string; room_number: string }[]> => {
    return api.get('/utilities/rooms-missing-initial', apartmentId ? { apartment_id: apartmentId } as Record<string, unknown> : undefined)
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
