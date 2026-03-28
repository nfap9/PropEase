'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@apartment-ultra/shared-ui/components/ui';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Home,
  Layers3,
  Percent,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { useBrandConfig } from '@/lib/brand-config-context';

function StatCard({
  title,
  value,
  description,
  helper,
  icon: Icon,
  toneClassName,
  valueBadgeVariant,
  testid,
}: {
  title: string;
  value: string | number;
  description?: string;
  helper?: string;
  icon: React.ElementType;
  toneClassName?: string;
  valueBadgeVariant?: 'warning' | 'destructive';
  testid?: string;
}) {
  return (
    <Card data-testid={testid} className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.14em]">{title}</CardDescription>
            <CardTitle className="mt-3 text-3xl font-semibold">
              {valueBadgeVariant ? (
                <Badge variant={valueBadgeVariant} className="px-3 py-1.5 text-sm">
                  {value}
                </Badge>
              ) : (
                value
              )}
            </CardTitle>
          </div>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              toneClassName || 'bg-muted text-muted-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {description ? <p className="text-sm font-medium text-foreground/90">{description}</p> : null}
        {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

function ActionLink({
  href,
  icon: Icon,
  title,
  detail,
  badge,
  variant,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  detail: string;
  badge?: string;
  variant?: 'warning' | 'destructive' | 'outline';
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-accent/50"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge ? <Badge variant={variant ?? 'outline'}>{badge}</Badge> : null}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

function MetricRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${tone || 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString()}`;
}

function formatRatio(value: number, total: number) {
  if (!total) {
    return '0%';
  }

  return `${Math.round((value / total) * 100)}%`;
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
        <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">欢迎使用{brandConfig.app_name}</h2>
        <p className="mb-4 text-muted-foreground">您还没有加入任何团队，请先创建一个团队开始使用</p>
        <a href="/organizations/new" className="text-primary hover:underline">
          前往创建团队
        </a>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">请选择团队</h2>
        <p className="mb-4 text-muted-foreground">请在顶部导航栏选择一个团队开始使用</p>
      </div>
    );
  }

  if (overviewLoading) {
    return <DashboardSkeleton />;
  }

  const totalApartments = overview?.total_apartments || 0;
  const totalRooms = overview?.total_rooms || 0;
  const occupiedRooms = overview?.occupied_rooms || 0;
  const availableRooms = overview?.available_rooms || 0;
  const occupancyRate = overview?.occupancy_rate || 0;
  const monthlyRevenue = overview?.monthly_revenue || 0;
  const pendingBills = overview?.pending_bills || 0;
  const overdueBills = overview?.overdue_bills || 0;
  const roomsMissingInitialReadings = overview?.rooms_missing_initial_readings || 0;

  const actionItems = [
    pendingBills > 0
      ? {
          href: '/bills?status=pending',
          icon: Clock,
          title: '待收账单',
          detail: '优先核对本月应收与到账情况',
          badge: `${pendingBills} 笔`,
          variant: 'warning' as const,
        }
      : null,
    overdueBills > 0
      ? {
          href: '/bills?status=overdue',
          icon: AlertCircle,
          title: '逾期账单',
          detail: '建议立即跟进催缴与回款计划',
          badge: `${overdueBills} 笔`,
          variant: 'destructive' as const,
        }
      : null,
    roomsMissingInitialReadings > 0
      ? {
          href: '/utilities',
          icon: Zap,
          title: '待补签约月读数',
          detail: '补齐水电初始值，避免后续账单偏差',
          badge: `${roomsMissingInitialReadings} 间`,
          variant: 'warning' as const,
        }
      : null,
    {
      href: '/reports',
      icon: ArrowUpRight,
      title: '查看经营分析',
      detail: '进入经营分析页查看更细的趋势拆解',
      badge: '分析',
      variant: 'outline' as const,
    },
  ].filter(Boolean) as Array<{
    href: string;
    icon: React.ElementType;
    title: string;
    detail: string;
    badge?: string;
    variant?: 'warning' | 'destructive' | 'outline';
  }>;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <Card className="overflow-hidden border-primary/10 bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--primary)/0.08)_100%)]">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className="mb-3">
                  业务首页
                </Badge>
                <CardTitle className="text-3xl font-semibold" data-testid="dashboard-heading">
                  首页
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl">
                  围绕房源、租约、账单与抄表状态构建的日常经营视图，帮助团队快速定位今天最该处理的事项。
                </CardDescription>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-background/85 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">当前团队</p>
                <p className="mt-2 text-base font-semibold">{organization.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">已接入 {totalApartments} 个公寓主体</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">入住效率</p>
              <p className="mt-3 text-3xl font-semibold">{occupancyRate}%</p>
              <p className="mt-2 text-sm text-muted-foreground">
                已入住 {occupiedRooms} 间 / 总计 {totalRooms} 间
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">本月应收</p>
              <p className="mt-3 text-3xl font-semibold">{formatCurrency(monthlyRevenue)}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                待收 {pendingBills} 笔，逾期 {overdueBills} 笔
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">资源余量</p>
              <p className="mt-3 text-3xl font-semibold">{availableRooms}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                可出租房间占比 {formatRatio(availableRooms, totalRooms)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>执行重点</CardTitle>
                <CardDescription>优先处理影响现金流和账单准确性的事项</CardDescription>
              </div>
              <Badge variant="outline">{actionItems.length} 项</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionItems.map((item) => (
              <ActionLink key={`${item.href}-${item.title}`} {...item} />
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="公寓数量"
          value={totalApartments}
          description="覆盖的公寓主体"
          helper={`当前团队已管理 ${totalApartments} 个公寓`}
          icon={Building2}
          toneClassName="bg-sky-100 text-sky-700"
          testid="dashboard-apartment-count"
        />
        <StatCard
          title="房间总数"
          value={totalRooms}
          description="可管理房间资源池"
          helper={`其中空置 ${availableRooms} 间`}
          icon={Home}
          toneClassName="bg-emerald-100 text-emerald-700"
          testid="dashboard-room-count"
        />
        <StatCard
          title="入住率"
          value={`${occupancyRate}%`}
          description={`${occupiedRooms} / ${totalRooms} 间已入住`}
          helper="反映房源消化与租赁稳定度"
          icon={Percent}
          toneClassName="bg-violet-100 text-violet-700"
          testid="dashboard-occupancy-rate"
        />
        <StatCard
          title="活跃租约"
          value={overview?.active_leases || 0}
          description="当前仍在履行中的租约"
          helper="可结合到期时间做续租计划"
          icon={FileText}
          toneClassName="bg-amber-100 text-amber-700"
          testid="dashboard-active-leases"
        />
        <StatCard
          title="租客总数"
          value={overview?.total_tenants || 0}
          description="已关联的在管租客"
          helper="建议定期核对租客与租约绑定关系"
          icon={Users}
          toneClassName="bg-cyan-100 text-cyan-700"
          testid="dashboard-tenant-count"
        />
        <StatCard
          title="本月收入"
          value={formatCurrency(monthlyRevenue)}
          description="本月账单口径下的应收金额"
          helper="用于衡量本期回款与账单规模"
          icon={DollarSign}
          toneClassName="bg-emerald-100 text-emerald-700"
          testid="dashboard-monthly-revenue"
        />
        <StatCard
          title="待收账单"
          value={pendingBills}
          description="尚未完成回款的账单"
          helper="建议按到期日排序逐步催收"
          icon={Clock}
          toneClassName="bg-amber-100 text-amber-700"
          valueBadgeVariant="warning"
          testid="dashboard-pending-bills"
        />
        <StatCard
          title="逾期账单"
          value={overdueBills}
          description={overdueBills ? '已超过应收期限，需要专项跟进' : '当前没有逾期账单'}
          helper="逾期越早处理，坏账风险越低"
          icon={AlertCircle}
          toneClassName="bg-rose-100 text-rose-700"
          valueBadgeVariant="destructive"
          testid="dashboard-overdue-bills"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>资产组合概览</CardTitle>
                <CardDescription>从房源供给、入住结构到租约活跃度快速了解经营面</CardDescription>
              </div>
              <Badge variant="outline">
                <Layers3 className="mr-1 h-3 w-3" />
                组合
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">房源结构</p>
              <MetricRow label="公寓数量" value={`${totalApartments} 个`} />
              <MetricRow label="房间总数" value={`${totalRooms} 间`} />
              <MetricRow label="可租房间" value={`${availableRooms} 间`} tone="text-emerald-600" />
              <MetricRow
                label="签约月待补读数"
                value={`${roomsMissingInitialReadings} 间`}
                tone={roomsMissingInitialReadings > 0 ? 'text-amber-600' : 'text-foreground'}
              />
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">履约结构</p>
              <MetricRow label="活跃租约" value={`${overview?.active_leases || 0} 份`} />
              <MetricRow label="租客总数" value={`${overview?.total_tenants || 0} 人`} />
              <MetricRow label="入住率" value={`${occupancyRate}%`} tone="text-primary" />
              <MetricRow label="空置率" value={`${Math.max(0, 100 - occupancyRate)}%`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>现金流关注项</CardTitle>
                <CardDescription>把收入、待收与逾期拉到同一个面板中观察</CardDescription>
              </div>
              <Badge variant="outline">
                <Wallet className="mr-1 h-3 w-3" />
                财务
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <MetricRow label="本月应收" value={formatCurrency(monthlyRevenue)} />
              <MetricRow
                label="待收账单"
                value={`${pendingBills} 笔`}
                tone={pendingBills > 0 ? 'text-amber-600' : 'text-foreground'}
              />
              <MetricRow
                label="逾期账单"
                value={`${overdueBills} 笔`}
                tone={overdueBills > 0 ? 'text-rose-600' : 'text-foreground'}
              />
              <MetricRow
                label="经营状态"
                value={overdueBills > 0 ? '需重点跟进' : '整体稳定'}
                tone={overdueBills > 0 ? 'text-rose-600' : 'text-emerald-600'}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">建议动作</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    优先处理逾期与待收账单，再补齐签约月初始水电读数，可显著提升后续账单准确率和回款节奏。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
