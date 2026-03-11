import api from './client'
import type { Tenant } from '@apartment-ultra/api-contract'

// 内部定义创建/更新数据类型
export interface CreateTenantData {
  name: string
  phone: string
  id_card_number?: string
  emergency_contact?: string
  emergency_phone?: string
  notes?: string
}

export interface UpdateTenantData {
  name?: string
  phone?: string
  id_card_number?: string
  emergency_contact?: string
  emergency_phone?: string
  notes?: string
}

export interface TenantListParams {
  search?: string
  page?: number
  limit?: number
}

export const tenantsApi = {
  /**
   * 获取租客列表
   */
  list: async (params?: TenantListParams): Promise<Tenant[]> => {
    return api.get<Tenant[]>('/tenants', params as Record<string, unknown>)
  },

  /**
   * 获取租客详情
   */
  get: async (id: string): Promise<Tenant> => {
    return api.get<Tenant>(`/tenants/${id}`)
  },

  /**
   * 创建租客
   */
  create: async (data: CreateTenantData): Promise<Tenant> => {
    return api.post<Tenant>('/tenants', data)
  },

  /**
   * 更新租客
   */
  update: async (id: string, data: UpdateTenantData): Promise<Tenant> => {
    return api.put<Tenant>(`/tenants/${id}`, data)
  },

  /**
   * 删除租客
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/tenants/${id}`)
  },
}

export default tenantsApi
