'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/lib/api/admin-client';
import { StatCard } from '@/components/dashboard/stat-card';
import { ChartCard } from '@/components/dashboard/chart-card';
import { IncomeChart } from '@/components/dashboard/income-chart';
import { OccupancyChart } from '@/components/dashboard/occupancy-chart';
import { YearFilter } from '@/components/dashboard/year-filter';
import { RefreshButton } from '@/components/dashboard/refresh-button';
import { StatCardsSkeleton } from '@/components/dashboard/skeleton';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminPlatformStats, IncomeReport, OccupancyReport } from '@apartment-ultra/api-contract';
import type { AxiosResponse } from 'axios';

function generateMockIncome(year: number, roomsCount: number): IncomeReport[] {
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0');
    const period = `${year}-${month}`;
    // Vary data slightly by month, scale by room count
    const baseRent = Math.max(roomsCount * 800, 20000);
    const variance = 0.85 + Math.random() * 0.3;
    const total_rent = Math.round(baseRent * variance);
    const total_water = Math.round(800 + Math.random() * 400);
    const total_electricity = Math.round(1200 + Math.random() * 600);
    const total_other = Math.round(300 + Math.random() * 200);
    const total_amount = total_rent + total_water + total_electricity + total_other;
    const collected_ratio = 0.72 + Math.random() * 0.22;
    const collected_amount = Math.round(total_amount * collected_ratio);
    const uncollected = total_amount - collected_amount;
    const collection_rate = Math.round((collected_ratio * 1000)) / 10;
    return {
      period,
      total_rent,
      total_water,
      total_electricity,
      total_other,
      total_amount,
      collected_amount,
      collection_rate,
    };
  });
  return months;
}

function generateMockOccupancy(year: number, roomsCount: number): OccupancyReport[] {
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0');
    const period = `${year}-${month}`;
    // Simulate seasonal occupancy: higher in spring/summer, lower in winter
    const seasonalBase = 0.68 + Math.sin((i / 12) * Math.PI * 2 + Math.PI) * 0.15;
    const occupancy_rate = Math.round((seasonalBase + (roomsCount / 1000)) * 1000) / 10;
    const clamped = Math.min(99, Math.max(50, occupancy_rate));
    const occupied_rooms = Math.round((clamped / 100) * roomsCount);
    const vacant_rooms = roomsCount - occupied_rooms;
    return {
      period,
      total_rooms: roomsCount,
      occupied_rooms,
      vacant_rooms,
      occupancy_rate: clamped,
    };
  });
  return months;
}

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

  const stats = statsResponse?.data;
  const roomsCount = stats?.rooms_count ?? 0;

  const incomeData = generateMockIncome(selectedYear, roomsCount);
  const occupancyData = generateMockOccupancy(selectedYear, roomsCount);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold" data-testid="admin-overview-heading">平台概览</h1>
        </div>
        <StatCardsSkeleton />
        <div className="h-96 rounded-xl bg-muted/20 animate-pulse" />
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive">加载统计数据失败</p>
        <Button variant="outline" onClick={handleRefresh}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" data-testid="admin-overview-heading">平台概览</h1>
        <RefreshButton onRefresh={handleRefresh} isLoading={statsLoading} />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="公寓数" value={stats.apartments_count ?? 0} />
        <StatCard title="房间数" value={stats.rooms_count ?? 0} />
        <StatCard title="入住率" value={stats.occupancy_rate ?? 0} isPercentage />
        <StatCard title="本月收入" value={(stats.monthly_revenue ?? 0) * 100} isCurrency />
        <StatCard title="待缴账单" value={stats.pending_bills ?? 0} />
        <StatCard title="逾期账单" value={stats.overdue_bills ?? 0} />
      </div>

      {/* Year Filter */}
      <div className="flex items-center gap-4">
        <YearFilter value={selectedYear} onChange={setSelectedYear} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartCard title="收入趋势">
            <IncomeChart data={incomeData} />
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <ChartCard title="入住率分析">
            <OccupancyChart data={occupancyData} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
