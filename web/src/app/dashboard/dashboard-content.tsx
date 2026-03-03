'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Home,
  Percent,
  FileText,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
} from 'lucide-react';

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  iconColor?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor || 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

export function DashboardContent() {
  const { organization, organizations, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard-overview', orgId],
    queryFn: () => reportsApi.getOverview(orgId!),
    enabled: !!orgId,
  });

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">欢迎使用公寓管理系统</h2>
        <p className="text-muted-foreground mb-4">
          您还没有加入任何组织，请先创建一个组织开始使用
        </p>
        <a
          href="/settings/team"
          className="text-primary hover:underline"
        >
          前往创建组织
        </a>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">请选择组织</h2>
        <p className="text-muted-foreground mb-4">
          请在顶部导航栏选择一个组织开始使用
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">仪表盘</h1>

      {overviewLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="公寓数量"
              value={overview?.total_apartments || 0}
              icon={Building2}
              iconColor="text-blue-500"
            />
            <StatCard
              title="房间总数"
              value={overview?.total_rooms || 0}
              icon={Home}
              iconColor="text-green-500"
            />
            <StatCard
              title="入住率"
              value={`${overview?.occupancy_rate || 0}%`}
              description={`${overview?.occupied_rooms || 0} / ${overview?.total_rooms || 0} 间`}
              icon={Percent}
              iconColor="text-purple-500"
            />
            <StatCard
              title="活跃租约"
              value={overview?.active_leases || 0}
              icon={FileText}
              iconColor="text-orange-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="租客总数"
              value={overview?.total_tenants || 0}
              icon={Users}
              iconColor="text-cyan-500"
            />
            <StatCard
              title="本月收入"
              value={`¥${(overview?.monthly_revenue || 0).toLocaleString()}`}
              icon={DollarSign}
              iconColor="text-emerald-500"
            />
            <StatCard
              title="待收账单"
              value={overview?.pending_bills || 0}
              icon={Clock}
              iconColor="text-amber-500"
            />
            <StatCard
              title="逾期账单"
              value={overview?.overdue_bills || 0}
              description={overview?.overdue_bills ? '需要及时跟进' : ''}
              icon={AlertCircle}
              iconColor="text-red-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>可用房间</CardTitle>
                <CardDescription>当前可供出租的房间</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">
                  {overview?.available_rooms || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  占总房间的{' '}
                  {overview?.total_rooms
                    ? Math.round(
                        ((overview?.available_rooms || 0) / overview.total_rooms) * 100
                      )
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>财务概览</CardTitle>
                <CardDescription>本月财务状况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">本月应收</span>
                    <span className="font-medium">
                      ¥{(overview?.monthly_revenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">待收账单</span>
                    <span className="font-medium text-orange-600">
                      {overview?.pending_bills || 0} 笔
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">逾期账单</span>
                    <span className="font-medium text-red-600">
                      {overview?.overdue_bills || 0} 笔
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
