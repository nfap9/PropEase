import api from './client';
import type { ReportOverview, IncomeReport, OccupancyReport } from '@apartment-ultra/api-contract';

export const reportsApi = {
  /**
   * 获取概览统计
   */
  getOverview: async (orgId: string): Promise<ReportOverview> => {
    return api.get<ReportOverview>('/reports/overview', { org_id: orgId });
  },

  /**
   * 获取收入报表
   */
  getIncome: async (
    orgId: string,
    params?: { year?: number; month?: number }
  ): Promise<IncomeReport> => {
    return api.get<IncomeReport>(`/reports/income`, { org_id: orgId, ...params });
  },

  /**
   * 获取入住率报表
   */
  getOccupancy: async (orgId: string): Promise<OccupancyReport> => {
    return api.get<OccupancyReport>('/reports/occupancy', { org_id: orgId });
  },
};
