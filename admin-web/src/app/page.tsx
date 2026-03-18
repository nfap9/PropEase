'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApiEndpoints, AdminPlatformStats } from '@/lib/api/admin-client';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Loader2 } from 'lucide-react';

function StatCard({ title, value, testid }: { title: string; value: number; testid?: string }) {
  return (
    <Card data-testid={testid}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await adminApiEndpoints.getStats();
      return res.data as AdminPlatformStats;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive">加载统计失败</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="mb-4 text-xl font-semibold" data-testid="admin-overview-heading">平台概览</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="组织数" value={stats.organizations_count} testid="admin-org-count" />
        <StatCard title="用户数" value={stats.users_count} testid="admin-user-count" />
        <StatCard title="公寓数" value={stats.apartments_count} testid="admin-apartment-count" />
        <StatCard title="房间数" value={stats.rooms_count} testid="admin-room-count" />
        <StatCard title="活跃订阅数" value={stats.active_subscriptions_count} testid="admin-subscription-count" />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        使用左侧导航管理运营账号、角色、组织、服务与订阅。
      </p>
    </div>
  );
}
