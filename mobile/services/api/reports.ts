import api from './client'
import type {
  DashboardOverview,
  IncomeReport,
  IncomeReportParams,
  OccupancyReport,
  OccupancyReportParams,
} from '@apartment-ultra/api-contract'

export type { IncomeReportParams, OccupancyReportParams };

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
