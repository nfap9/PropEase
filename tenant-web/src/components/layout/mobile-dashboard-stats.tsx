// tenant-web/src/components/layout/mobile-dashboard-stats.tsx

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apartmentsApi, billsApi, leasesApi, reportsApi, roomsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { tenantMessages } from '@/lib/i18n';
import { StatCard } from '@apartment-ultra/shared-ui/components/ui';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Home, Receipt, TrendingUp, Bell, Zap, Clock } from 'lucide-react';
import Link from 'next/link';

function formatCurrency(value: number) {
  return `¥${value.toLocaleString()}`;
}

interface ReminderItem {
  type: 'warning' | 'destructive';
  count: number;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function MobileDashboardStats() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 公寓和房间数据
  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const apartmentIds = apartments?.map((a) => a.id) ?? [];

  const { data: allRooms = [] } = useQuery({
    queryKey: ['rooms-all', orgId, apartmentIds],
    queryFn: () => roomsApi.listAll(orgId!, apartmentIds),
    enabled: !!orgId && apartmentIds.length > 0,
  });

  const availableRooms = allRooms.filter((r) => r.status === 'available');

  // 账单数据
  const { data: bills = [] } = useQuery({
    queryKey: ['bills-monthly', orgId, currentYear, currentMonth],
    queryFn: () => billsApi.list(orgId!, { year: currentYear, month: currentMonth }),
    enabled: !!orgId,
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases', orgId],
    queryFn: () => leasesApi.list(orgId!, true),
    enabled: !!orgId,
  });

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview', orgId],
    queryFn: () => reportsApi.getOverview(orgId!),
    enabled: !!orgId,
  });

  // 计算统计数据
  const pendingBills = bills.filter((b) => b.status === 'pending').length;
  const billedBills = bills.filter((b) => b.status === 'partial' || b.status === 'overdue');
  const settledBills = bills.filter((b) => b.status === 'paid');

  const billedAmount = [...billedBills, ...settledBills].reduce((sum, b) => sum + b.total_amount, 0);
  const collectedAmount = [...billedBills, ...settledBills].reduce((sum, b) => sum + b.paid_amount, 0);

  const estimatedTotal = leases.reduce((sum, l) => sum + (l.monthly_rent || 0), 0);
  const upstreamCost = estimatedTotal * 0.8;

  // 营收数据
  const { data: incomeData = [] } = useQuery({
    queryKey: ['income-year', orgId, currentYear],
    queryFn: () => reportsApi.getIncome(orgId!, currentYear),
    enabled: !!orgId,
  });

  const yearlyBilled = incomeData.reduce((sum, d) => sum + d.total_amount, 0);
  const yearlyCollected = incomeData.reduce((sum, d) => sum + d.collected_amount, 0);

  // 本月营收
  const monthData = incomeData.find(
    (d) => d.period === `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  );
  const monthlyBilled = monthData?.total_amount || 0;
  const monthlyCollected = monthData?.collected_amount || 0;

  // 提醒数据
  const reminders = [
    {
      type: 'warning' as const,
      count: overview?.rooms_missing_initial_readings || 0,
      label: tenantMessages.dashboard.reminders.missingReading,
      href: '/utilities',
      icon: Zap,
    },
    {
      type: 'warning' as const,
      count: (overview?.pending_bills || 0) + (overview?.overdue_bills || 0),
      label: tenantMessages.dashboard.reminders.pendingCollection,
      href: '/bills?status=overview',
      icon: Clock,
    },
  ].filter((r) => r.count > 0) as ReminderItem[];

  const totalReminders = reminders.reduce((sum, r) => sum + r.count, 0);

  if (!orgId) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 数字仪表盘 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 房间状态 */}
        <StatCard
          title={tenantMessages.dashboard.roomStatus.title}
          value={`${availableRooms.length}/${allRooms.length}`}
          description="可用房间"
          icon={<Home className="h-5 w-5" />}
          tone="primary"
        />

        {/* 账单状态 */}
        <StatCard
          title={tenantMessages.dashboard.billStatus.title}
          value={pendingBills}
          description="待支付账单"
          icon={<Receipt className="h-5 w-5" />}
          tone="warning"
        />

        {/* 营收数据 */}
        <StatCard
          title="本月营收"
          value={formatCurrency(monthlyBilled)}
          description={`实收 ${formatCurrency(monthlyCollected)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="success"
        />

        {/* 待处理提醒 */}
        <StatCard
          title="待处理"
          value={totalReminders}
          description="提醒事项"
          icon={<Bell className="h-5 w-5" />}
          tone="danger"
        />
      </div>

      {/* 详情展开 - Accordion */}
      <Accordion type="multiple" className="w-full">
        {/* 房间详情 */}
        <AccordionItem value="rooms">
          <AccordionTrigger className="px-3">
            <span className="text-sm font-medium">房间详情</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-3 pb-3">
              {availableRooms.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">暂无可用房间</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableRooms.map((room) => (
                    <Badge key={room.id} variant="secondary">
                      {room.apartment?.name ? `${room.apartment.name} - ` : ''}{room.room_number}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 账单详情 */}
        <AccordionItem value="bills">
          <AccordionTrigger className="px-3">
            <span className="text-sm font-medium">账单详情</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 px-3 pb-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">本月应收</span>
                <span className="font-medium">{formatCurrency(billedAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">本月实收</span>
                <span className="font-medium text-emerald-600">{formatCurrency(collectedAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">预计总房租</span>
                <span className="font-medium">{formatCurrency(estimatedTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">上游成本</span>
                <span className="font-medium text-rose-600">{formatCurrency(upstreamCost)}</span>
              </div>
              <Link href="/bills" className="mt-2 block text-sm text-primary hover:underline">
                查看全部账单
              </Link>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 营收详情 */}
        <AccordionItem value="revenue">
          <AccordionTrigger className="px-3">
            <span className="text-sm font-medium">营收详情</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 px-3 pb-3">
              <div className="mb-2 text-sm font-medium">{currentYear}年汇总</div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">年度总应收</span>
                <span className="font-medium">{formatCurrency(yearlyBilled)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">年度已收</span>
                <span className="font-medium text-emerald-600">{formatCurrency(yearlyCollected)}</span>
              </div>
              <div className="mt-2 border-t pt-2">
                <div className="mb-2 text-sm font-medium">{currentYear}年{currentMonth}月</div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">本月应收</span>
                  <span className="font-medium">{formatCurrency(monthlyBilled)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">本月实收</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(monthlyCollected)}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 提醒详情 */}
        <AccordionItem value="reminders">
          <AccordionTrigger className="px-3">
            <span className="text-sm font-medium">提醒详情</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 px-3 pb-3">
              {reminders.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">暂无待处理提醒</p>
              ) : (
                reminders.map((reminder) => {
                  const Icon = reminder.icon;
                  return (
                    <Link
                      key={reminder.label}
                      href={reminder.href}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${reminder.type === 'destructive' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{reminder.label}</span>
                      </div>
                      <Badge variant={reminder.type}>{reminder.count}</Badge>
                    </Link>
                  );
                })
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}