import api from './client';
import { DashboardOverview, IncomeReport, OccupancyReport } from '@/types';

export const reportsApi = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await api.get<DashboardOverview>('/reports/overview');
    return response.data;
  },

  getIncome: async (year: number): Promise<IncomeReport[]> => {
    const response = await api.get<IncomeReport[]>('/reports/income', {
      params: { year },
    });
    return response.data;
  },

  getOccupancy: async (year: number): Promise<OccupancyReport[]> => {
    const response = await api.get<OccupancyReport[]>('/reports/occupancy', {
      params: { year },
    });
    return response.data;
  },
};

export default reportsApi;
