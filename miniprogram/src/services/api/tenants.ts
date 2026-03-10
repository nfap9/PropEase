import api from './client'
import type { Tenant } from '@apartment-ultra/api-contract'

export const tenantApi = {
  list: async (params?: {
    page?: number
    pageSize?: number
    search?: string
  }): Promise<{ data: Tenant[]; total: number }> => {
    const response = await api.get<{ data: Tenant[]; total: number }>('/tenants', {
      params,
    })
    return response.data.data
  },

  getById: async (id: number): Promise<Tenant> => {
    const response = await api.get<Tenant>(`/tenants/${id}`)
    return response.data.data
  },

  create: async (data: Partial<Tenant>): Promise<Tenant> => {
    const response = await api.post<Tenant>('/tenants', data)
    return response.data.data
  },

  update: async (id: number, data: Partial<Tenant>): Promise<Tenant> => {
    const response = await api.patch<Tenant>(`/tenants/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tenants/${id}`)
  },
}
