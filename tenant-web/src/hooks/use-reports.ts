import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';

export function useReportsData(selectedYear: number) {
  const overviewQuery = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => reportsApi.getOverview(),
  });

  const incomeReportQuery = useQuery({
    queryKey: ['income-report', selectedYear],
    queryFn: () => reportsApi.getIncome(selectedYear),
  });

  const occupancyReportQuery = useQuery({
    queryKey: ['occupancy-report', selectedYear],
    queryFn: () => reportsApi.getOccupancy(selectedYear),
  });

  return {
    overview: overviewQuery.data,
    incomeReport: incomeReportQuery.data,
    incomeLoading: incomeReportQuery.isLoading,
    occupancyReport: occupancyReportQuery.data,
    occupancyLoading: occupancyReportQuery.isLoading,
  };
}
