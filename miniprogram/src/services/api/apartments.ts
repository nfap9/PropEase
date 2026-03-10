import api from './client'
import type { Apartment, ApartmentWithStats } from '@apartment-ultra/api-contract'

export const apartmentApi = {
  list: async (params?: {
    page?: number
    pageSize?: number
    search?: string
  }): Promise<{ data: ApartmentWithStats[]; total: number }> => {
    const response = await api.get<{ data: ApartmentWithStats[]; total: number }>('/apartments', {
      params,
    })
    return response.data.data
  },

  getById: async (id: number): Promise<ApartmentWithStats> => {
    const response = await api.get<ApartmentWithStats>(`/apartments/${id}`)
    return response.data.data
  },

  create: async (data: Partial<Apartment>): Promise<Apartment> => {
    const response = await api.post<Apartment>('/apartments', data)
    return response.data.data
  },

  update: async (id: number, data: Partial<Apartment>): Promise<Apartment> => {
    const response = await api.patch<Apartment>(`/apartments/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/apartments/${id}`)
  },
}
