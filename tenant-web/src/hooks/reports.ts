import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api';

export function useReportsData(orgId: string | undefined, selectedYear: number) {
  const overviewQuery = useQuery({
    queryKey: ['dashboard-overview', orgId],
    queryFn: () => reportsApi.getOverview(orgId!),
    enabled: Boolean(orgId),
  });

  const incomeReportQuery = useQuery({
    queryKey: ['income-report', orgId, selectedYear],
    queryFn: () => reportsApi.getIncome(orgId!, selectedYear),
    enabled: Boolean(orgId),
  });

  const occupancyReportQuery = useQuery({
    queryKey: ['occupancy-report', orgId, selectedYear],
    queryFn: () => reportsApi.getOccupancy(orgId!, selectedYear),
    enabled: Boolean(orgId),
  });

  return {
    overview: overviewQuery.data,
    incomeReport: incomeReportQuery.data,
    incomeLoading: incomeReportQuery.isLoading,
    occupancyReport: occupancyReportQuery.data,
    occupancyLoading: occupancyReportQuery.isLoading,
  };
}
