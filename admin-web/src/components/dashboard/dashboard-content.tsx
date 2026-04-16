
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/api/admin-client';
import { ChartCard } from '@/components/dashboard/chart-card';
import { IncomeChart } from '@/components/dashboard/income-chart';
import { YearFilter } from '@/components/dashboard/year-filter';
import { RefreshButton } from '@/components/dashboard/refresh-button';
import { StatCardsSkeleton } from '@/components/dashboard/skeleton';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { KpiSection } from '@apartment-ultra/shared-ui/components/ui';
import { PageHeader } from '@apartment-ultra/shared-ui/components/ui';
import { PageToolbar } from '@apartment-ultra/shared-ui/components/ui';
import { StatCard } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminPlatformStats } from '@apartment-ultra/api-contract';
import type { AxiosResponse } from 'axios';
import type { IncomeReport } from '@apartment-ultra/api-contract';
import { adminMessages } from '@/i18n';

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

  const { data: incomeResponse } = useQuery({
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
        <PageHeader title={adminMessages.dashboard.heading} titleTestId="admin-overview-heading" />
        <StatCardsSkeleton />
        <div className="h-96 animate-pulse rounded-xl bg-muted/20" />
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
      <PageHeader
        title=""
        titleTestId="admin-overview-heading"
        actions={<RefreshButton onRefresh={handleRefresh} isLoading={statsLoading} />}
      />

      <KpiSection columns={6}>
        <StatCard title={adminMessages.dashboard.stats.apartments} value={stats.apartments_count ?? 0} />
        <StatCard title={adminMessages.dashboard.stats.rooms} value={stats.rooms_count ?? 0} />
        <StatCard
          title={adminMessages.dashboard.stats.occupancy}
          value={stats.occupancy_rate ?? 0}
          format="percent"
          precision={1}
          tone="primary"
        />
        <StatCard
          title={adminMessages.dashboard.stats.monthlyRevenue}
          value={stats.monthly_revenue ?? 0}
          format="currency"
          precision={2}
          tone="success"
        />
        <StatCard title={adminMessages.dashboard.stats.pendingBills} value={stats.pending_bills ?? 0} tone="warning" />
        <StatCard title={adminMessages.dashboard.stats.overdueBills} value={stats.overdue_bills ?? 0} tone="danger" />
      </KpiSection>

      <PageToolbar className="justify-start">
        <YearFilter value={selectedYear} onChange={setSelectedYear} />
      </PageToolbar>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-1">
        <ChartCard title={adminMessages.dashboard.charts.incomeTrend}>
          <IncomeChart data={incomeData} />
        </ChartCard>
      </div>
    </div>
  );
}
