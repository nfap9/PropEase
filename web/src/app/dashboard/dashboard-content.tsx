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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Building2,
  Home,
  Percent,
  FileText,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { useBrandConfig } from '@/lib/brand-config-context';

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  valueBadgeVariant,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  iconColor?: string;
  valueBadgeVariant?: 'warning' | 'destructive';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor || 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        {valueBadgeVariant ? (
          <Badge variant={valueBadgeVariant} className="text-base px-3 py-1">
            {value}
          </Badge>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
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
  const brandConfig = useBrandConfig();
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
        <h2 className="text-xl font-semibold mb-2">欢迎使用{brandConfig.app_name}</h2>
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
      <h1 className="text-3xl font-bold">首页</h1>

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
              valueBadgeVariant="warning"
            />
            <StatCard
              title="逾期账单"
              value={overview?.overdue_bills || 0}
              description={overview?.overdue_bills ? '需要及时跟进' : ''}
              icon={AlertCircle}
              iconColor="text-red-500"
              valueBadgeVariant="destructive"
            />
          </div>

          {/* 待办提醒 */}
          {(overview?.pending_bills ?? 0) > 0 ||
          (overview?.overdue_bills ?? 0) > 0 ||
          (overview?.rooms_missing_initial_readings ?? 0) > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>待办提醒</CardTitle>
                <CardDescription>需要及时跟进的事项</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(overview?.pending_bills ?? 0) > 0 && (
                  <Link
                    href="/bills?status=pending"
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>待收账单</span>
                      <Badge variant="warning">{overview?.pending_bills} 笔</Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                )}
                {(overview?.overdue_bills ?? 0) > 0 && (
                  <Link
                    href="/bills?status=overdue"
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span>逾期账单</span>
                      <Badge variant="destructive">{overview?.overdue_bills} 笔</Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                )}
                {(overview?.rooms_missing_initial_readings ?? 0) > 0 && (
                  <Link
                    href="/utilities"
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-600" />
                      <span>未录入签约月初始水电读数</span>
                      <Badge variant="warning">{overview?.rooms_missing_initial_readings} 间</Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : null}

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
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">待收账单</span>
                    <Badge variant="warning">{overview?.pending_bills || 0} 笔</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">逾期账单</span>
                    <Badge variant="destructive">{overview?.overdue_bills || 0} 笔</Badge>
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
