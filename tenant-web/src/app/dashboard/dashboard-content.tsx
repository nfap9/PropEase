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
import { tenantI18n, tenantMessages } from '@/lib/i18n';

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
        <h2 className="mb-2 text-xl font-semibold">
          {tenantI18n.t('dashboard.noOrganizationsTitle', { appName: brandConfig.app_name })}
        </h2>
        <p className="mb-4 text-muted-foreground">{tenantMessages.dashboard.noOrganizationsDescription}</p>
        <a href="/organizations/new" className="text-primary hover:underline">
          {tenantMessages.dashboard.createTeam}
        </a>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">{tenantMessages.dashboard.selectTeamTitle}</h2>
        <p className="mb-4 text-muted-foreground">{tenantMessages.dashboard.selectTeamDescription}</p>
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
          title: tenantMessages.dashboard.actionFocus.pendingBillsTitle,
          detail: tenantMessages.dashboard.actionFocus.pendingBillsDetail,
          badge: tenantI18n.t('dashboard.actionFocus.pendingBillsBadge', { count: pendingBills }),
          variant: 'warning' as const,
        }
      : null,
    overdueBills > 0
      ? {
          href: '/bills?status=overdue',
          icon: AlertCircle,
          title: tenantMessages.dashboard.actionFocus.overdueBillsTitle,
          detail: tenantMessages.dashboard.actionFocus.overdueBillsDetail,
          badge: tenantI18n.t('dashboard.actionFocus.pendingBillsBadge', { count: overdueBills }),
          variant: 'destructive' as const,
        }
      : null,
    roomsMissingInitialReadings > 0
      ? {
          href: '/utilities',
          icon: Zap,
          title: tenantMessages.dashboard.actionFocus.missingReadingsTitle,
          detail: tenantMessages.dashboard.actionFocus.missingReadingsDetail,
          badge: tenantI18n.t('dashboard.actionFocus.missingReadingsBadge', {
            count: roomsMissingInitialReadings,
          }),
          variant: 'warning' as const,
        }
      : null,
    {
      href: '/reports',
      icon: ArrowUpRight,
      title: tenantMessages.dashboard.actionFocus.reportsTitle,
      detail: tenantMessages.dashboard.actionFocus.reportsDetail,
      badge: tenantMessages.dashboard.actionFocus.reportsBadge,
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
                  {tenantMessages.dashboard.hero.badge}
                </Badge>
                <CardTitle className="text-3xl font-semibold" data-testid="dashboard-heading">
                  {tenantMessages.dashboard.hero.title}
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl">
                  {tenantMessages.dashboard.hero.description}
                </CardDescription>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-background/85 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {tenantMessages.dashboard.hero.currentTeam}
                </p>
                <p className="mt-2 text-base font-semibold">{organization.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tenantI18n.t('dashboard.hero.connectedApartments', { count: totalApartments })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {tenantMessages.dashboard.hero.occupancyTitle}
              </p>
              <p className="mt-3 text-3xl font-semibold">{occupancyRate}%</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {tenantI18n.t('dashboard.hero.occupancyDetail', {
                  occupied: occupiedRooms,
                  total: totalRooms,
                })}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {tenantMessages.dashboard.hero.revenueTitle}
              </p>
              <p className="mt-3 text-3xl font-semibold">{formatCurrency(monthlyRevenue)}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {tenantI18n.t('dashboard.hero.revenueDetail', {
                  pending: pendingBills,
                  overdue: overdueBills,
                })}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {tenantMessages.dashboard.hero.capacityTitle}
              </p>
              <p className="mt-3 text-3xl font-semibold">{availableRooms}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {tenantI18n.t('dashboard.hero.capacityDetail', {
                  ratio: formatRatio(availableRooms, totalRooms),
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{tenantMessages.dashboard.actionFocus.title}</CardTitle>
                <CardDescription>{tenantMessages.dashboard.actionFocus.description}</CardDescription>
              </div>
              <Badge variant="outline">
                {tenantI18n.t('dashboard.actionFocus.count', { count: actionItems.length })}
              </Badge>
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
          title={tenantMessages.dashboard.stats.apartmentsTitle}
          value={totalApartments}
          description={tenantMessages.dashboard.stats.apartmentsDescription}
          helper={tenantI18n.t('dashboard.stats.apartmentsHelper', { count: totalApartments })}
          icon={Building2}
          toneClassName="bg-sky-100 text-sky-700"
          testid="dashboard-apartment-count"
        />
        <StatCard
          title={tenantMessages.dashboard.stats.roomsTitle}
          value={totalRooms}
          description={tenantMessages.dashboard.stats.roomsDescription}
          helper={tenantI18n.t('dashboard.stats.roomsHelper', { count: availableRooms })}
          icon={Home}
          toneClassName="bg-emerald-100 text-emerald-700"
          testid="dashboard-room-count"
        />
        <StatCard
          title={tenantMessages.dashboard.stats.occupancyTitle}
          value={`${occupancyRate}%`}
          description={tenantI18n.t('dashboard.stats.occupancyDescription', {
            occupied: occupiedRooms,
            total: totalRooms,
          })}
          helper={tenantMessages.dashboard.stats.occupancyHelper}
          icon={Percent}
          toneClassName="bg-violet-100 text-violet-700"
          testid="dashboard-occupancy-rate"
        />
        <StatCard
          title={tenantMessages.dashboard.stats.leasesTitle}
          value={overview?.active_leases || 0}
          description={tenantMessages.dashboard.stats.leasesDescription}
          helper={tenantMessages.dashboard.stats.leasesHelper}
          icon={FileText}
          toneClassName="bg-amber-100 text-amber-700"
          testid="dashboard-active-leases"
        />
        <StatCard
          title={tenantMessages.dashboard.stats.tenantsTitle}
          value={overview?.total_tenants || 0}
          description={tenantMessages.dashboard.stats.tenantsDescription}
          helper={tenantMessages.dashboard.stats.tenantsHelper}
          icon={Users}
          toneClassName="bg-cyan-100 text-cyan-700"
          testid="dashboard-tenant-count"
        />
        <StatCard
          title={tenantMessages.dashboard.stats.revenueTitle}
          value={formatCurrency(monthlyRevenue)}
          description={tenantMessages.dashboard.stats.revenueDescription}
          helper={tenantMessages.dashboard.stats.revenueHelper}
          icon={DollarSign}
          toneClassName="bg-emerald-100 text-emerald-700"
          testid="dashboard-monthly-revenue"
        />
        <StatCard
          title={tenantMessages.dashboard.stats.pendingTitle}
          value={pendingBills}
          description={tenantMessages.dashboard.stats.pendingDescription}
          helper={tenantMessages.dashboard.stats.pendingHelper}
          icon={Clock}
          toneClassName="bg-amber-100 text-amber-700"
          valueBadgeVariant="warning"
          testid="dashboard-pending-bills"
        />
        <StatCard
          title={tenantMessages.dashboard.stats.overdueTitle}
          value={overdueBills}
          description={
            overdueBills
              ? tenantMessages.dashboard.stats.overdueDescriptionActive
              : tenantMessages.dashboard.stats.overdueDescriptionClear
          }
          helper={tenantMessages.dashboard.stats.overdueHelper}
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
                <CardTitle>{tenantMessages.dashboard.portfolio.title}</CardTitle>
                <CardDescription>{tenantMessages.dashboard.portfolio.description}</CardDescription>
              </div>
              <Badge variant="outline">
                <Layers3 className="mr-1 h-3 w-3" />
                {tenantMessages.dashboard.portfolio.badge}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {tenantMessages.dashboard.portfolio.supplyTitle}
              </p>
              <MetricRow
                label={tenantMessages.dashboard.portfolio.apartments}
                value={tenantI18n.t('dashboard.portfolio.apartmentsValue', { count: totalApartments })}
              />
              <MetricRow
                label={tenantMessages.dashboard.portfolio.rooms}
                value={tenantI18n.t('dashboard.portfolio.roomsValue', { count: totalRooms })}
              />
              <MetricRow
                label={tenantMessages.dashboard.portfolio.availableRooms}
                value={tenantI18n.t('dashboard.portfolio.availableRoomsValue', { count: availableRooms })}
                tone="text-emerald-600"
              />
              <MetricRow
                label={tenantMessages.dashboard.portfolio.missingReadings}
                value={tenantI18n.t('dashboard.portfolio.missingReadingsValue', {
                  count: roomsMissingInitialReadings,
                })}
                tone={roomsMissingInitialReadings > 0 ? 'text-amber-600' : 'text-foreground'}
              />
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {tenantMessages.dashboard.portfolio.performanceTitle}
              </p>
              <MetricRow
                label={tenantMessages.dashboard.portfolio.activeLeases}
                value={tenantI18n.t('dashboard.portfolio.activeLeasesValue', {
                  count: overview?.active_leases || 0,
                })}
              />
              <MetricRow
                label={tenantMessages.dashboard.portfolio.tenants}
                value={tenantI18n.t('dashboard.portfolio.tenantsValue', {
                  count: overview?.total_tenants || 0,
                })}
              />
              <MetricRow label={tenantMessages.dashboard.portfolio.occupancy} value={`${occupancyRate}%`} tone="text-primary" />
              <MetricRow label={tenantMessages.dashboard.portfolio.vacancy} value={`${Math.max(0, 100 - occupancyRate)}%`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{tenantMessages.dashboard.cashflow.title}</CardTitle>
                <CardDescription>{tenantMessages.dashboard.cashflow.description}</CardDescription>
              </div>
              <Badge variant="outline">
                <Wallet className="mr-1 h-3 w-3" />
                {tenantMessages.dashboard.cashflow.badge}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <MetricRow label={tenantMessages.dashboard.cashflow.revenue} value={formatCurrency(monthlyRevenue)} />
              <MetricRow
                label={tenantMessages.dashboard.cashflow.pending}
                value={tenantI18n.t('dashboard.cashflow.pendingValue', { count: pendingBills })}
                tone={pendingBills > 0 ? 'text-amber-600' : 'text-foreground'}
              />
              <MetricRow
                label={tenantMessages.dashboard.cashflow.overdue}
                value={tenantI18n.t('dashboard.cashflow.overdueValue', { count: overdueBills })}
                tone={overdueBills > 0 ? 'text-rose-600' : 'text-foreground'}
              />
              <MetricRow
                label={tenantMessages.dashboard.cashflow.businessStatus}
                value={
                  overdueBills > 0
                    ? tenantMessages.dashboard.cashflow.businessStatusAttention
                    : tenantMessages.dashboard.cashflow.businessStatusStable
                }
                tone={overdueBills > 0 ? 'text-rose-600' : 'text-emerald-600'}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">{tenantMessages.dashboard.cashflow.recommendationTitle}</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    {tenantMessages.dashboard.cashflow.recommendationDescription}
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
