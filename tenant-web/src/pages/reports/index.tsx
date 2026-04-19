import { lazy } from 'react';
import { useState } from 'react';
import { Building2 } from 'lucide-react';
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
import { useAuth } from '@/contexts/auth';
import { useReportsData } from '@/hooks/reports';
import { getReportYearOptions, REPORTS } from '@/schemas/reports';
import { ReportsOverviewTab } from '@/components/reports/reports-overview-tab';

const ReportsIncomeTab = lazy(() => import('@/components/reports/reports-income-tab').then((mod) => ({ default: mod.ReportsIncomeTab })));
const ReportsOccupancyTab = lazy(() => import('@/components/reports/reports-occupancy-tab').then((mod) => ({ default: mod.ReportsOccupancyTab })));

type ReportTab = 'income' | 'occupancy' | 'overview';

function ReportsFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96" />
    </div>
  );
}

export default function ReportsPage() {
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
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先创建或加入团队</h2>
        <p className="text-muted-foreground">在顶部导航栏选择或创建一个团队开始使用</p>
      </div>
    );
  }

  return (
    <PermissionPageGuard>
      <div className="space-y-6">
          <div className="flex items-center justify-end">
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
    </PermissionPageGuard>
  );
}
