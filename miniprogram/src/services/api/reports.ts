import api from './client'
import type { DashboardOverview } from '@apartment-ultra/api-contract'

export const reportApi = {
  getDashboard: async (): Promise<DashboardOverview> => {
    const response = await api.get<DashboardOverview>('/reports/dashboard')
    return response.data.data
  },

  getIncomeReport: async (params?: {
    startDate?: string
    endDate?: string
  }) => {
    const response = await api.get('/reports/income', { params })
    return response.data.data
  },

  getOccupancyReport: async (params?: {
    startDate?: string
    endDate?: string
  }) => {
    const response = await api.get('/reports/occupancy', { params })
    return response.data.data
  },
}
