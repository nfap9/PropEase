import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, CreditCard, BarChart3 } from 'lucide-react';
import { adminApiEndpoints } from '@/api/admin-client';
import { RefreshButton } from '@/pages/index/components/refresh-button';
import { StatCardsSkeleton } from '@/pages/index/components/skeleton';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{adminMessages.dashboard.heading}</h1>
        <RefreshButton onRefresh={handleRefresh} isLoading={statsLoading} />
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
            <CardDescription className="text-sm font-medium">
              {adminMessages.dashboard.stats.monthlyRevenue}
            </CardDescription>
            <div className="text-primary flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/80 shadow-sm">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-3xl font-semibold tracking-tight">
              ¥{stats.monthly_revenue?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
            <CardDescription className="text-sm font-medium">
              {adminMessages.dashboard.stats.organizations}
            </CardDescription>
            <div className="text-primary flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/80 shadow-sm">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-3xl font-semibold tracking-tight">
              {stats.organizations_count ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
            <CardDescription className="text-sm font-medium">
              {adminMessages.dashboard.stats.users}
            </CardDescription>
            <div className="text-primary flex h-11 w-11 items-center justify-center rounded-2xl border border-border/60 bg-background/80 shadow-sm">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-3xl font-semibold tracking-tight">
              {stats.users_count ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
            <CardDescription className="text-sm font-medium">
              {adminMessages.dashboard.stats.subscriptions}
            </CardDescription>
            <div className="text-[hsl(var(--success))] flex h-11 w-11 items-center justify-center rounded-2xl border border-[hsl(var(--success))/0.2] bg-[hsl(var(--success))/0.1] shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-foreground text-3xl font-semibold tracking-tight">
              {stats.active_subscriptions_count ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
