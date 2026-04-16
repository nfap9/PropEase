'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { useIsMobile } from '@apartment-ultra/shared-ui/hooks';
import Link from 'next/link';
import {
  AlertCircle,
  BookDown,
  Building2,
  Clock,
  FileText,
  Home,
  Receipt,
  ScrollText,
  Send,
  Wallet,
  Zap,
} from 'lucide-react';
import { MobileDashboardStats } from '@/components/layout/mobile-dashboard-stats';
import { apartmentsApi, billsApi, leasesApi, reportsApi, roomsApi } from '@/api';
import { useAuth } from '@/auth/context';
import { useBrandConfig } from '@/contexts/brand-config';
import { tenantMessages } from '@/i18n';

function formatCurrency(value: number) {
  return `¥${value.toLocaleString()}`;
}

function QuickActions() {
  const actions = [
    { href: '/utilities', icon: ScrollText, label: tenantMessages.dashboard.quickActions.waterElectricity },
    { href: '/bills?filter=unpaid', icon: Wallet, label: tenantMessages.dashboard.quickActions.collection },
    { href: '/bills/generate', icon: Send, label: tenantMessages.dashboard.quickActions.billing },
    { href: '/leases/new', icon: FileText, label: tenantMessages.dashboard.quickActions.signing },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-2 py-2 sm:px-3 transition-all hover:bg-accent/50"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-8 sm:w-8">
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="text-xs sm:text-sm font-medium truncate">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function RoomStatusCard({ orgId }: { orgId: string }) {
  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId),
    enabled: !!orgId,
  });

  const apartmentIds = useMemo(() => apartments?.map((a) => a.id) ?? [], [apartments]);

  const { data: allRooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms-all', orgId, apartmentIds],
    queryFn: () => roomsApi.listAll(orgId, apartmentIds),
    enabled: !!orgId && apartmentIds.length > 0,
  });

  const availableRooms = useMemo(
    () => allRooms.filter((r) => r.status === 'available'),
    [allRooms]
  );

  if (apartmentsLoading || roomsLoading) {
    return (
      <Card className="flex h-full min-h-0 flex-col">
        <CardHeader className="shrink-0 pb-2">
          <CardTitle className="text-sm sm:text-base">{tenantMessages.dashboard.roomStatus.title}</CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">加载中...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="shrink-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm sm:text-base truncate">{tenantMessages.dashboard.roomStatus.title}</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">
              {tenantMessages.dashboard.roomStatus.available}: {availableRooms.length} / {tenantMessages.dashboard.roomStatus.total}: {allRooms.length}
            </CardDescription>
          </div>
          <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
        {availableRooms.length === 0 ? (
          <p className="py-2 text-center text-xs sm:text-sm text-muted-foreground">
            {tenantMessages.dashboard.roomStatus.emptyList}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {availableRooms.map((room) => (
              <Badge key={room.id} variant="secondary" className="px-1.5 py-0.5 text-[10px] sm:text-xs font-normal">
                {room.apartment?.name ? `${room.apartment.name} - ` : ''}{room.room_number}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BillStatusCard({ orgId }: { orgId: string }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills-monthly', orgId, currentYear, currentMonth],
    queryFn: () => billsApi.list(orgId, { year: currentYear, month: currentMonth }),
    enabled: !!orgId,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases', orgId],
    queryFn: () => leasesApi.list(orgId, true),
    enabled: !!orgId,
  });

  const stats = useMemo(() => {
    const pending = bills.filter((b) => b.status === 'pending');
    const billed = bills.filter((b) => b.status === 'partial' || b.status === 'overdue');
    const settled = bills.filter((b) => b.status === 'paid');

    const billedAmount = [...billed, ...settled].reduce((sum, b) => sum + b.total_amount, 0);
    const collectedAmount = settled.reduce((sum, b) => sum + b.paid_amount, 0) +
      billed.reduce((sum, b) => sum + b.paid_amount, 0);

    // Estimated: sum of monthly_rent for active leases (rough estimate for pending bills)
    const estimatedTotal = leases.reduce((sum, l) => sum + (l.monthly_rent || 0), 0);

    // Upstream cost: for now estimate as 80% of rent (placeholder - actual would need utility costs)
    const upstreamCost = estimatedTotal * 0.8;

    return { pending, billed, settled, billedAmount, collectedAmount, estimatedTotal, upstreamCost };
  }, [bills, leases]);

  if (isLoading) {
    return (
      <Card className="flex h-full min-h-0 flex-col">
        <CardHeader className="shrink-0 pb-2">
          <CardTitle className="text-sm sm:text-base">{tenantMessages.dashboard.billStatus.title}</CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">加载中...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="shrink-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base">{tenantMessages.dashboard.billStatus.title}</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">
              {currentYear}年{currentMonth}月
            </CardDescription>
          </div>
          <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden space-y-2 pt-0 sm:space-y-3">
        {/* Bill counts */}
        <div className="flex gap-2 sm:gap-4">
          <div className="flex-1 text-center">
            <p className="text-lg sm:text-xl font-semibold text-amber-600">{stats.pending.length}</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">{tenantMessages.dashboard.billStatus.pending}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-lg sm:text-xl font-semibold text-blue-600">{stats.billed.length}</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">{tenantMessages.dashboard.billStatus.billed}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-lg sm:text-xl font-semibold text-emerald-600">{stats.settled.length}</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">{tenantMessages.dashboard.billStatus.settled}</p>
          </div>
        </div>

        {/* Financial stats */}
        <div className="space-y-1 border-t pt-2 sm:pt-3 sm:space-y-1.5">
          <div className="flex justify-between text-[10px] sm:text-xs">
            <span className="text-muted-foreground">{tenantMessages.dashboard.billStatus.billedAmount}</span>
            <span className="font-medium">{formatCurrency(stats.billedAmount)}</span>
          </div>
          <div className="flex justify-between text-[10px] sm:text-xs">
            <span className="text-muted-foreground">{tenantMessages.dashboard.billStatus.collectedAmount}</span>
            <span className="font-medium text-emerald-600">{formatCurrency(stats.collectedAmount)}</span>
          </div>
          <div className="flex justify-between text-[10px] sm:text-xs">
            <span className="text-muted-foreground">{tenantMessages.dashboard.billStatus.estimatedTotal}</span>
            <span className="font-medium">{formatCurrency(stats.estimatedTotal)}</span>
          </div>
          <div className="flex justify-between text-[10px] sm:text-xs">
            <span className="text-muted-foreground">{tenantMessages.dashboard.billStatus.upstreamCost}</span>
            <span className="font-medium text-rose-600">{formatCurrency(stats.upstreamCost)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RemindersCard({ missingReadings, pendingBills, overdueBills }: { missingReadings: number; pendingBills: number; overdueBills: number }) {
  const reminders = [
    {
      type: 'warning' as const,
      count: missingReadings,
      label: tenantMessages.dashboard.reminders.missingReading,
      href: '/utilities',
      icon: Zap,
    },
    {
      type: 'destructive' as const,
      count: 0,
      label: tenantMessages.dashboard.reminders.billingError,
      href: '/bills',
      icon: AlertCircle,
    },
    {
      type: 'warning' as const,
      count: pendingBills + overdueBills,
      label: tenantMessages.dashboard.reminders.pendingCollection,
      href: '/bills?status=overdue',
      icon: Clock,
    },
  ].filter((r) => r.count > 0);

  if (reminders.length === 0) {
    return (
      <Card className="flex h-full min-h-0 flex-col">
        <CardHeader className="shrink-0 pb-2">
          <CardTitle className="text-sm sm:text-base">{tenantMessages.dashboard.reminders.title}</CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-hidden">
          <p className="py-2 text-center text-xs sm:text-sm text-muted-foreground">暂无待处理事务</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="shrink-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base">{tenantMessages.dashboard.reminders.title}</CardTitle>
          <Badge variant="outline">{reminders.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden space-y-1 pt-0">
        {reminders.map((reminder) => {
          const Icon = reminder.icon;
          return (
            <Link
              key={reminder.label}
              href={reminder.href}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-2 py-1.5 sm:px-3 sm:py-2 transition-all hover:bg-accent/50"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg ${reminder.type === 'destructive' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-medium truncate">{reminder.label}</span>
              </div>
              <Badge variant={reminder.type} className="px-1 text-[10px] sm:px-1.5 sm:text-xs">
                {reminder.count}
              </Badge>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RevenueChartCard({ orgId }: { orgId: string }) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const { data: incomeData = [], isLoading } = useQuery({
    queryKey: ['income-year', orgId, currentYear],
    queryFn: () => reportsApi.getIncome(orgId, currentYear),
    enabled: !!orgId,
  });

  // Fill in missing months with 0
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const chartData = months.map((month, index) => {
    const monthData = incomeData.find((d) => d.period === `${currentYear}-${String(index + 1).padStart(2, '0')}`);
    return {
      month,
      amount: monthData?.total_amount || 0,
      collected: monthData?.collected_amount || 0,
    };
  });

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1);

  if (isLoading) {
    return (
      <Card className="flex h-full min-h-0 flex-col">
        <CardHeader className="shrink-0 pb-2">
          <CardTitle className="text-sm sm:text-base">{currentYear}年营收</CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">加载中...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-hidden pt-0">
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="shrink-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base">{currentYear}年营收</CardTitle>
            <CardDescription className="text-[10px] sm:text-xs">近一年每月营收统计</CardDescription>
          </div>
          <BookDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex h-full min-h-0 flex-col overflow-hidden pt-0">
        <div className="flex flex-1 items-end gap-px sm:gap-1 min-h-[60px]">
          {chartData.map((data, index) => {
            const heightPercent = (data.amount / maxAmount) * 100;
            const collectedHeightPercent = (data.collected / maxAmount) * 100;
            const isCurrentMonth = index === now.getMonth();
            return (
              <div key={data.month} className="group relative flex flex-1 flex-col items-center gap-0.5">
                <div className="flex w-full flex-1 items-end justify-center gap-px sm:gap-0.5">
                  {/* Total amount bar */}
                  <div
                    className={`w-2 sm:w-3 rounded-t transition-all ${isCurrentMonth ? 'bg-primary' : 'bg-primary/40'}`}
                    style={{ height: `${heightPercent}%`, minHeight: data.amount > 0 ? '3px' : '0' }}
                  />
                  {/* Collected amount bar */}
                  <div
                    className="w-2 sm:w-3 rounded-t bg-emerald-400"
                    style={{ height: `${collectedHeightPercent}%`, minHeight: data.collected > 0 ? '3px' : '0' }}
                  />
                </div>
                <span className={`text-[8px] sm:text-[10px] ${isCurrentMonth ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                  {data.month.replace('月', '')}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-1 sm:mt-3 flex items-center justify-center gap-3 sm:gap-6 text-[9px] sm:text-xs">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2" />
            <span className="text-muted-foreground">应收</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 sm:h-2 sm:w-2" />
            <span className="text-muted-foreground">实收</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 sm:h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid flex-1 gap-3 grid-cols-1 lg:grid-cols-2 min-h-0" style={{ minHeight: '200px' }}>
        {[1, 2].map((i) => (
          <div key={i} className="h-full min-h-0 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid flex-1 gap-3 grid-cols-1 lg:grid-cols-2 min-h-0" style={{ minHeight: '200px' }}>
        {[1, 2].map((i) => (
          <div key={i} className="h-full min-h-0 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function DashboardContent() {
  const { organization, organizations, isLoading: authLoading } = useAuth();
  const brandConfig = useBrandConfig();
  const orgId = organization?.id;
  const isMobile = useIsMobile();

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview', orgId],
    queryFn: () => reportsApi.getOverview(orgId!),
    enabled: !!orgId,
  });

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center py-12">
        <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">
          {tenantMessages.dashboard.noOrganizationsTitle.replace('{appName}', brandConfig.app_name)}
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
      <div className="flex h-full min-h-0 flex-col items-center justify-center py-12">
        <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">{tenantMessages.dashboard.selectTeamTitle}</h2>
        <p className="mb-4 text-muted-foreground">{tenantMessages.dashboard.selectTeamDescription}</p>
      </div>
    );
  }

  // 移动端布局
  if (isMobile) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
        <QuickActions />
        <MobileDashboardStats />
      </div>
    );
  }

  // 桌面端布局（保持现有代码）
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <QuickActions />

      <div className="grid flex-1 gap-3 grid-cols-1 lg:grid-cols-2 min-h-0" style={{ minHeight: '200px' }}>
        <RoomStatusCard orgId={orgId} />
        <BillStatusCard orgId={orgId} />
      </div>

      <div className="grid flex-1 gap-3 grid-cols-1 lg:grid-cols-2 min-h-0" style={{ minHeight: '200px' }}>
        <RemindersCard
          missingReadings={overview?.rooms_missing_initial_readings || 0}
          pendingBills={overview?.pending_bills || 0}
          overdueBills={overview?.overdue_bills || 0}
        />
        <RevenueChartCard orgId={orgId} />
      </div>
    </div>
  );
}
