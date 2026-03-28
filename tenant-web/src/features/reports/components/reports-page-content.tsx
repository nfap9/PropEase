'use client';

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
import { ReportsIncomeTab } from './reports-income-tab';
import { ReportsOccupancyTab } from './reports-occupancy-tab';
import { ReportsOverviewTab } from './reports-overview-tab';

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
          <h2 className="text-xl font-semibold">请先创建或加入组织</h2>
          <p className="text-muted-foreground">在顶部导航栏选择或创建一个组织开始使用</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold" data-testid={REPORTS.HEADING}>
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

          <Tabs defaultValue="income" className="space-y-4">
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
              <ReportsIncomeTab selectedYear={selectedYear} incomeReport={incomeReport} incomeLoading={incomeLoading} />
            </TabsContent>

            <TabsContent value="occupancy">
              <ReportsOccupancyTab
                selectedYear={selectedYear}
                overview={overview}
                occupancyReport={occupancyReport}
                occupancyLoading={occupancyLoading}
              />
            </TabsContent>

            <TabsContent value="overview">
              <ReportsOverviewTab overview={overview} />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </PermissionPageGuard>
  );
}
