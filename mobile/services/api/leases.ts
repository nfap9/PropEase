import api from './client'
import type { Lease } from '@apartment-ultra/api-contract'

// 内部定义创建/更新数据类型
export interface CreateLeaseData {
  room_id: string
  tenant_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  deposit: number
  notes?: string
}

export interface UpdateLeaseData {
  start_date?: string
  end_date?: string
  monthly_rent?: number
  deposit?: number
  notes?: string
  is_active?: boolean
}

export interface LeaseListParams {
  is_active?: boolean
  room_id?: string
  tenant_id?: string
  page?: number
  limit?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LeaseWithDetails = any

export const leasesApi = {
  /**
   * 获取租约列表
   */
  list: async (params?: LeaseListParams): Promise<LeaseWithDetails[]> => {
    return api.get<LeaseWithDetails[]>('/leases', params as Record<string, unknown>)
  },

  /**
   * 获取租约详情
   */
  get: async (id: string): Promise<LeaseWithDetails> => {
    return api.get<LeaseWithDetails>(`/leases/${id}`)
  },

  /**
   * 创建租约
   */
  create: async (data: CreateLeaseData): Promise<Lease> => {
    return api.post<Lease>('/leases', data)
  },

  /**
   * 更新租约
   */
  update: async (id: string, data: UpdateLeaseData): Promise<Lease> => {
    return api.put<Lease>(`/leases/${id}`, data)
  },

  /**
   * 删除租约
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/leases/${id}`)
  },

  /**
   * 终止租约
   */
  terminate: async (id: string): Promise<Lease> => {
    return api.post<Lease>(`/leases/${id}/terminate`)
  },
}

export default leasesApi
