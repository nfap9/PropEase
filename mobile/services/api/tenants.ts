import api from './client'
import type { Tenant, TenantCreate, TenantListParams, TenantUpdate } from '@apartment-ultra/api-contract'
import type { Lease } from '@apartment-ultra/api-contract'

export type { TenantListParams }

/** 租客与租约关联（API 实际返回结构） */
export interface TenantWithLease extends Tenant {
  lease?: Lease[]
  /** 性别（API 实际返回字段） */
  gender?: 'male' | 'female'
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
  create: async (data: TenantCreate): Promise<Tenant> => {
    return api.post<Tenant>('/tenants', data)
  },

  /**
   * 更新租客
   */
  update: async (id: string, data: TenantUpdate): Promise<Tenant> => {
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
