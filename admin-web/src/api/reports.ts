import api from './client';
import { DashboardOverview, IncomeReport, OccupancyReport } from '@/types';

export const reportsApi = {
  getOverview: async (orgId: string): Promise<DashboardOverview> => {
    const response = await api.get<DashboardOverview>('/reports/overview', {
      params: { org_id: orgId },
    });
    return response.data;
  },

  getIncome: async (orgId: string, year: number): Promise<IncomeReport[]> => {
    const response = await api.get<IncomeReport[]>('/reports/income', {
      params: { org_id: orgId, year },
    });
    return response.data;
  },

  getOccupancy: async (orgId: string, year: number): Promise<OccupancyReport[]> => {
    const response = await api.get<OccupancyReport[]>('/reports/occupancy', {
      params: { org_id: orgId, year },
    });
    return response.data;
  },
};

export default reportsApi;
