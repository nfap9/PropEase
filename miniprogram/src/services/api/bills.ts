import api from './client'
import type { Bill } from '@apartment-ultra/api-contract'

export const billApi = {
  list: async (params?: {
    page?: number
    pageSize?: number
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<{ data: Bill[]; total: number }> => {
    const response = await api.get<{ data: Bill[]; total: number }>('/bills', {
      params,
    })
    return response.data.data
  },

  getById: async (id: number): Promise<Bill> => {
    const response = await api.get<Bill>(`/bills/${id}`)
    return response.data.data
  },

  create: async (data: Partial<Bill>): Promise<Bill> => {
    const response = await api.post<Bill>('/bills', data)
    return response.data.data
  },

  pay: async (id: number, paymentMethod?: string): Promise<Bill> => {
    const response = await api.post<Bill>(`/bills/${id}/pay`, { paymentMethod })
    return response.data.data
  },

  getStatistics: async (): Promise<{
    total: number
    pending: number
    paid: number
    overdue: number
  }> => {
    const response = await api.get('/bills/statistics')
    return response.data.data
  },
}
