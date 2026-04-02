'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { useAuth } from '@/lib/auth/context';
import { useReportsData } from '../reports.hooks';
import { getReportYearOptions, REPORTS } from '../reports.schemas';
import { ReportsOverviewTab } from './reports-overview-tab';

const ReportsIncomeTab = dynamic(
  () => import('./reports-income-tab').then((mod) => mod.ReportsIncomeTab),
  { loading: () => <Skeleton className="h-[400px]" />, ssr: false }
);

const ReportsOccupancyTab = dynamic(
  () => import('./reports-occupancy-tab').then((mod) => mod.ReportsOccupancyTab),
  { loading: () => <Skeleton className="h-[400px]" />, ssr: false }
);

type ReportTab = 'income' | 'occupancy' | 'overview';

function ReportsFallback() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    </MainLayout>
  );
}

export function ReportsPageContent() {
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<ReportTab>('income');
  const { overview, incomeReport, incomeLoading, occupancyReport, occupancyLoading } = useReportsData(
    orgId,
    selectedYear
  );

  if (authLoading) {
    return <ReportsFallback />;
  }

  if (!orgId) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">请先创建或加入团队</h2>
          <p className="text-muted-foreground">在顶部导航栏选择或创建一个团队开始使用</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight" data-testid={REPORTS.HEADING}>
              经营分析
            </h1>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-[120px]" data-testid={REPORTS.YEAR_SELECT}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getReportYearOptions().map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ReportTab)}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="income" data-testid={REPORTS.INCOME_TAB}>
                收入分析
              </TabsTrigger>
              <TabsTrigger value="occupancy" data-testid={REPORTS.OCCUPANCY_TAB}>
                入住率
              </TabsTrigger>
              <TabsTrigger value="overview" data-testid={REPORTS.OVERVIEW_TAB}>
                总览
              </TabsTrigger>
            </TabsList>

            <TabsContent value="income">
              {activeTab === 'income' ? (
                <ReportsIncomeTab
                  selectedYear={selectedYear}
                  incomeReport={incomeReport}
                  incomeLoading={incomeLoading}
                />
              ) : null}
            </TabsContent>

            <TabsContent value="occupancy">
              {activeTab === 'occupancy' ? (
                <ReportsOccupancyTab
                  selectedYear={selectedYear}
                  overview={overview}
                  occupancyReport={occupancyReport}
                  occupancyLoading={occupancyLoading}
                />
              ) : null}
            </TabsContent>

            <TabsContent value="overview">
              {activeTab === 'overview' ? <ReportsOverviewTab overview={overview} /> : null}
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </PermissionPageGuard>
  );
}
