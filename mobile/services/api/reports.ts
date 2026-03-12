import api from './client'
import type { DashboardOverview, IncomeReport, OccupancyReport } from '@apartment-ultra/api-contract'

export interface IncomeReportParams {
  start_date?: string
  end_date?: string
  group_by?: 'day' | 'week' | 'month'
}

export interface OccupancyReportParams {
  start_date?: string
  end_date?: string
}

export const reportsApi = {
  /**
   * 获取仪表盘概览
   */
  getOverview: async (): Promise<DashboardOverview> => {
    return api.get<DashboardOverview>('/reports/overview')
  },

  /**
   * 获取收入报表
   */
  getIncome: async (params?: IncomeReportParams): Promise<IncomeReport[]> => {
    return api.get<IncomeReport[]>('/reports/income', params as Record<string, unknown>)
  },

  /**
   * 获取入住率报表
   */
  getOccupancy: async (params?: OccupancyReportParams): Promise<OccupancyReport[]> => {
    return api.get<OccupancyReport[]>('/reports/occupancy', params as Record<string, unknown>)
  },
}

export default reportsApi
