
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, CreditCard, BarChart3 } from 'lucide-react';
import { Button, Card } from 'antd';
import { adminApiEndpoints } from '@/api/admin-client';
import { RefreshButton } from '@/pages/index/components/refresh-button';
import { StatCardsSkeleton } from '@/pages/index/components/skeleton';
import type { AdminPlatformStats } from '@apartment-ultra/api-contract';
import type { AxiosResponse } from 'axios';
import { adminMessages } from '@/i18n';

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();

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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{adminMessages.dashboard.heading}</h1>
        </div>
        <StatCardsSkeleton />
        <div className="h-96 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4">
        <p className="text-red-500">{adminMessages.dashboard.loadError}</p>
        <Button onClick={handleRefresh}>
          {adminMessages.common.retry}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{adminMessages.dashboard.heading}</h1>
        <RefreshButton onRefresh={handleRefresh} isLoading={statsLoading} />
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card styles={{ body: { padding: '12px 16px' } }}>
          <div className="flex flex-row items-start justify-between gap-4 pb-2">
            <p className="text-sm font-medium text-gray-500">
              {adminMessages.dashboard.stats.monthlyRevenue}
            </p>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="text-gray-900 text-3xl font-semibold tracking-tight">
            ¥{stats.monthly_revenue?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
          </div>
        </Card>
        <Card styles={{ body: { padding: '12px 16px' } }}>
          <div className="flex flex-row items-start justify-between gap-4 pb-2">
            <p className="text-sm font-medium text-gray-500">
              {adminMessages.dashboard.stats.organizations}
            </p>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="text-gray-900 text-3xl font-semibold tracking-tight">
            {stats.organizations_count ?? 0}
          </div>
        </Card>
        <Card styles={{ body: { padding: '12px 16px' } }}>
          <div className="flex flex-row items-start justify-between gap-4 pb-2">
            <p className="text-sm font-medium text-gray-500">
              {adminMessages.dashboard.stats.users}
            </p>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="text-gray-900 text-3xl font-semibold tracking-tight">
            {stats.users_count ?? 0}
          </div>
        </Card>
        <Card styles={{ body: { padding: '12px 16px' } }}>
          <div className="flex flex-row items-start justify-between gap-4 pb-2">
            <p className="text-sm font-medium text-gray-500">
              {adminMessages.dashboard.stats.subscriptions}
            </p>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-green-200 bg-green-50 shadow-sm">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="text-gray-900 text-3xl font-semibold tracking-tight">
            {stats.active_subscriptions_count ?? 0}
          </div>
        </Card>
      </div>
    </div>
  );
}
