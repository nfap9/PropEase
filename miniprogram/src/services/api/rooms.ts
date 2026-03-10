import api from './client'
import type { Room } from '@apartment-ultra/api-contract'

export const roomApi = {
  list: async (params?: {
    page?: number
    pageSize?: number
    apartmentId?: number
    status?: string
  }): Promise<{ data: Room[]; total: number }> => {
    const response = await api.get<{ data: Room[]; total: number }>('/rooms', {
      params,
    })
    return response.data.data
  },

  getById: async (id: number): Promise<Room> => {
    const response = await api.get<Room>(`/rooms/${id}`)
    return response.data.data
  },

  create: async (data: Partial<Room>): Promise<Room> => {
    const response = await api.post<Room>('/rooms', data)
    return response.data.data
  },

  update: async (id: number, data: Partial<Room>): Promise<Room> => {
    const response = await api.patch<Room>(`/rooms/${id}`, data)
    return response.data.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/rooms/${id}`)
  },
}
