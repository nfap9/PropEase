# Tenant-web 移动端首页适配实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对 tenant-web 首页进行移动端适配，将图表替换为数字仪表盘，桌面端保持不变

**Architecture:** 使用 `useIsMobile` hook 检测设备类型，条件渲染移动端/桌面端布局。移动端使用 2x2 StatCard 网格 + Accordion 展开详情。

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui (StatCard, Accordion), @apartment-ultra/shared-ui

---

## 文件结构

```
tenant-web/src/
├── app/dashboard/
│   └── dashboard-content.tsx          # 修改: 添加移动端/桌面端条件渲染
└── components/layout/
    └── mobile-dashboard-stats.tsx     # 新增: 移动端数字仪表盘组件
```

---

## Task 1: 创建 MobileDashboardStats 组件

**文件:**
- 新增: `tenant-web/src/components/layout/mobile-dashboard-stats.tsx`

**概述:** 创建移动端数字仪表盘组件，使用 2x2 StatCard 网格展示核心指标，点击展开详情

```tsx
// tenant-web/src/components/layout/mobile-dashboard-stats.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apartmentsApi, billsApi, leasesApi, reportsApi, roomsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { tenantMessages } from '@/lib/i18n';
import { StatCard } from '@apartment-ultra/shared-ui/components/ui';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { Home, Receipt, TrendingUp, Bell, Zap, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function formatCurrency(value: number) {
  return `¥${value.toLocaleString()}`;
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
      href: '/bills?status=overdue',
      icon: Clock,
    },
  ].filter((r) => r.count > 0);

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
                <p className="text-sm text-muted-foreground py-2">暂无可用房间</p>
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
              <div className="text-sm font-medium mb-2">{currentYear}年汇总</div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">年度总应收</span>
                <span className="font-medium">{formatCurrency(yearlyBilled)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">年度已收</span>
                <span className="font-medium text-emerald-600">{formatCurrency(yearlyCollected)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="text-sm font-medium mb-2">{currentYear}年{currentMonth}月</div>
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
                <p className="text-sm text-muted-foreground py-2">暂无待处理提醒</p>
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
```

---

## Task 2: 修改 DashboardContent 条件渲染

**文件:**
- 修改: `tenant-web/src/app/dashboard/dashboard-content.tsx:424-483`

**概述:** 在 `DashboardContent` 组件中添加移动端/桌面端条件渲染

需要修改 `DashboardContent` 函数：

1. 导入 `useIsMobile` 从 `@apartment-ultra/shared-ui/hooks`
2. 导入 `MobileDashboardStats` 组件
3. 在函数开头添加 `const isMobile = useIsMobile()`
4. 在 return 语句中，添加条件渲染：
   - 移动端 (`isMobile`): 显示 `QuickActions` + `MobileDashboardStats`
   - 桌面端 (`!isMobile`): 保持现有的卡片网格布局

```tsx
// 在文件顶部添加导入
import { useIsMobile } from '@apartment-ultra/shared-ui/hooks';
import { MobileDashboardStats } from '@/components/layout/mobile-dashboard-stats';

// 在 DashboardContent 函数中
export function DashboardContent() {
  const { organization, organizations, isLoading: authLoading } = useAuth();
  const brandConfig = useBrandConfig();
  const orgId = organization?.id;
  const isMobile = useIsMobile();  // 新增

  // ... 现有的 data queries ...

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
```

**注意:** `QuickActions` 组件已有响应式设计（`grid-cols-2 sm:grid-cols-4`），在移动端显示为 2x2 网格，无需修改。

---

## Task 3: 添加 Accordion 组件

**文件:**
- 新增: `packages/shared-ui/src/components/ui/accordion.tsx`

如果 `shared-ui` 中没有 Accordion 组件，需要从 shadcn/ui 添加。

Accordion 组件标准实现：

```tsx
// packages/shared-ui/src/components/ui/accordion.tsx
'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b', className)}
    {...props}
  />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
```

**需要安装依赖:**
```bash
pnpm --filter apartment-ultra-shared-ui add @radix-ui/react-accordion
```

并在 `packages/shared-ui/src/components/ui/index.ts` 中导出。

---

## Task 4: 验证实现

1. 启动开发服务器：`pnpm dev:web`
2. 在浏览器中打开 http://localhost:3000
3. 使用浏览器开发者工具切换设备模式（移动端视图）
4. 验证：
   - 首页显示 2x2 数字仪表盘
   - 点击各数字卡片可展开详情
   - 桌面端保持原有图表布局

---

## 改动文件清单

| 文件 | 操作 |
|------|------|
| `packages/shared-ui/src/components/ui/accordion.tsx` | 新增（如不存在） |
| `packages/shared-ui/src/components/ui/index.ts` | 修改：导出 Accordion |
| `tenant-web/src/components/layout/mobile-dashboard-stats.tsx` | 新增 |
| `tenant-web/src/app/dashboard/dashboard-content.tsx` | 修改：添加条件渲染 |
