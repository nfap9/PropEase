'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/lib/api/admin-client';
import { StatCard } from '@/components/dashboard/stat-card';
import { ChartCard } from '@/components/dashboard/chart-card';
import { IncomeChart } from '@/components/dashboard/income-chart';
import { YearFilter } from '@/components/dashboard/year-filter';
import { RefreshButton } from '@/components/dashboard/refresh-button';
import { StatCardsSkeleton } from '@/components/dashboard/skeleton';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminPlatformStats } from '@apartment-ultra/api-contract';
import type { AxiosResponse } from 'axios';
import type { IncomeReport } from '@apartment-ultra/api-contract';
import { adminMessages } from '@/lib/i18n';

export function DashboardContent() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const {
    data: statsResponse,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res: AxiosResponse<AdminPlatformStats> = await adminApiEndpoints.getStats();
      return res;
    },
  });

  const {
    data: incomeResponse,
  } = useQuery({
    queryKey: ['admin', 'income', selectedYear],
    queryFn: async () => {
      const res = await adminApiEndpoints.getAdminIncome(selectedYear);
      return res.data;
    },
  });

  const stats = statsResponse?.data;
  const incomeData: IncomeReport[] = incomeResponse ?? [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold" data-testid="admin-overview-heading">{adminMessages.dashboard.heading}</h1>
        </div>
        <StatCardsSkeleton />
        <div className="h-96 rounded-xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive">{adminMessages.dashboard.loadError}</p>
        <Button variant="outline" onClick={handleRefresh}>
          {adminMessages.common.retry}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="admin-overview-heading">{adminMessages.dashboard.heading}</h1>
        <RefreshButton onRefresh={handleRefresh} isLoading={statsLoading} />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title={adminMessages.dashboard.stats.apartments} value={stats.apartments_count ?? 0} />
        <StatCard title={adminMessages.dashboard.stats.rooms} value={stats.rooms_count ?? 0} />
        <StatCard title={adminMessages.dashboard.stats.occupancy} value={stats.occupancy_rate ?? 0} isPercentage />
        <StatCard title={adminMessages.dashboard.stats.monthlyRevenue} value={(stats.monthly_revenue ?? 0) * 100} isCurrency />
        <StatCard title={adminMessages.dashboard.stats.pendingBills} value={stats.pending_bills ?? 0} />
        <StatCard title={adminMessages.dashboard.stats.overdueBills} value={stats.overdue_bills ?? 0} />
      </div>

      {/* Year Filter */}
      <div className="flex items-center gap-4">
        <YearFilter value={selectedYear} onChange={setSelectedYear} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-1">
        <ChartCard title={adminMessages.dashboard.charts.incomeTrend}>
          <IncomeChart data={incomeData} />
        </ChartCard>
      </div>
    </div>
  );
}
