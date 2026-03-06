'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApiEndpoints, AdminPlatformStats } from '@/lib/api/admin-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// 注意: 实际使用时从 testids 导入 ADMIN 常量
const ADMIN = {
  HEADING: 'admin-heading',
  STATS_ORGS: 'admin-stats-orgs',
  STATS_USERS: 'admin-stats-users',
  STATS_APARTMENTS: 'admin-stats-apartments',
  STATS_ROOMS: 'admin-stats-rooms',
  STATS_SUBSCRIPTIONS: 'admin-stats-subscriptions',
} as const;

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
      <h2 className="mb-4 text-xl font-semibold" data-testid={ADMIN.HEADING}>平台概览</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="组织数" value={stats.organizations_count} testid={ADMIN.STATS_ORGS} />
        <StatCard title="用户数" value={stats.users_count} testid={ADMIN.STATS_USERS} />
        <StatCard title="公寓数" value={stats.apartments_count} testid={ADMIN.STATS_APARTMENTS} />
        <StatCard title="房间数" value={stats.rooms_count} testid={ADMIN.STATS_ROOMS} />
        <StatCard title="活跃订阅数" value={stats.active_subscriptions_count} testid={ADMIN.STATS_SUBSCRIPTIONS} />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        使用左侧导航管理运营账号、角色、组织、套餐与订阅。
      </p>
    </div>
  );
}
