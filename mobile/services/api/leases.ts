import api from './client'
import type { Lease, LeaseCreate, LeaseListParams, LeaseUpdate } from '@apartment-ultra/api-contract'

export type { LeaseListParams };
export type LeaseWithDetails = Lease;

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
  create: async (data: LeaseCreate): Promise<Lease> => {
    return api.post<Lease>('/leases', data)
  },

  /**
   * 更新租约
   */
  update: async (id: string, data: LeaseUpdate): Promise<Lease> => {
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
