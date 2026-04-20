
import { lazy } from 'react';
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Select } from 'antd';
import { Skeleton } from 'antd';
import { useAuth } from '@/contexts/auth';
import { useReportsData } from '@/hooks/reports';
import { getReportYearOptions, REPORTS } from '@/schemas/reports';
import { ReportsOverviewTab } from '@/pages/reports/components/reports-overview-tab';

const ReportsIncomeTab = lazy(() => import('@/pages/reports/components/reports-income-tab').then((mod) => ({ default: mod.ReportsIncomeTab })));
const ReportsOccupancyTab = lazy(() => import('@/pages/reports/components/reports-occupancy-tab').then((mod) => ({ default: mod.ReportsOccupancyTab })));

type ReportTab = 'income' | 'occupancy' | 'overview';

function ReportsFallback() {
  return (
    <div className="space-y-6">
      <Skeleton.Input active size="large" style={{ width: 200, height: 32 }} />
      <Skeleton active paragraph={{ rows: 10 }} />
    </div>
  );
}

export default function ReportsPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<ReportTab>('income');
  const { overview, incomeReport, incomeLoading, occupancyReport, occupancyLoading } = useReportsData(
    selectedYear
  );

  if (authLoading) {
    return <ReportsFallback />;
  }

  if (!orgId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-gray-400" />
        <h2 className="text-xl font-semibold">请先创建或加入团队</h2>
        <p className="text-gray-500">在顶部导航栏选择或创建一个团队开始使用</p>
      </div>
    );
  }

  return (
    <PermissionPageGuard>
      <div className="space-y-6">
          <div className="flex items-center justify-end">
            <Select
              value={selectedYear.toString()}
              onChange={(value) => setSelectedYear(Number(value))}
              style={{ width: 120 }}
              data-testid={REPORTS.YEAR_SELECT}
              options={getReportYearOptions().map((year) => ({ value: year, label: `${year}年` }))}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('income')}
              data-testid={REPORTS.INCOME_TAB}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'income'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              收入分析
            </button>
            <button
              onClick={() => setActiveTab('occupancy')}
              data-testid={REPORTS.OCCUPANCY_TAB}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'occupancy'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              入住率
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              data-testid={REPORTS.OVERVIEW_TAB}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              总览
            </button>
          </div>

          <div>
            {activeTab === 'income' && (
              <ReportsIncomeTab
                selectedYear={selectedYear}
                incomeReport={incomeReport}
                incomeLoading={incomeLoading}
              />
            )}
            {activeTab === 'occupancy' && (
              <ReportsOccupancyTab
                selectedYear={selectedYear}
                overview={overview}
                occupancyReport={occupancyReport}
                occupancyLoading={occupancyLoading}
              />
            )}
            {activeTab === 'overview' && <ReportsOverviewTab overview={overview} />}
          </div>
        </div>
    </PermissionPageGuard>
  );
}
